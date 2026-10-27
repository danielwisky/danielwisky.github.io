// Optimizes the posts' cover photos.
//
// Flow: drop the original in `_photos/<post-slug>.jpg` (or .png/.webp) and
// run `npm run build:photos`. The slug is the post filename without the date,
// so `_posts/2023-01-16-clean-code-funcoes.md` gets
// `_photos/clean-code-funcoes.jpg`. That name is what ties the photo to the
// post: the map in _data/photos.yml is keyed by it, and
// _includes/post-cover.html checks it before falling back to the tag cover.
//
// The script is INCREMENTAL: it only processes sources whose output does not
// exist yet (or is older than the original). In practice, publishing a new
// post processes only its photo; the old ones are not even touched.
//
// This matters because `_photos/` is not versioned — the originals are heavy
// and recoverable. On a fresh clone the folder does not even exist, and the
// script must be harmless in that case.
//
//   npm run build:photos             processes what is missing
//   npm run build:photos -- --force  reprocesses everything (when sizes change)
//   npm run build:photos -- --prune  removes outputs with no matching original
//                                    (only with the full set at hand)
//
// `_photos/` starts with an underscore: Jekyll does not publish the folder,
// only the optimized versions in assets/ go to the site.

import { readdir, readFile, writeFile, mkdir, rm, access, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "_photos";
const OUT_DIR = "assets/img/photos";

// Reserved name: `_photos/avatar.*` is not a post cover, it is the hero photo.
// It comes out square at 2x (the hero shows 132px) and goes to its own map.
const AVATAR = "avatar";
const AVATAR_OUT = "assets/img/avatar.webp";
const AVATAR_SIZE = 264;

// Each variant exists because some place on the site shows it at a different
// size. Serving 1200px to a 370px card was the heaviest cost, hence the
// `card` variant, which srcset serves instead of `cover`.
//
//   cover  3:2, 712px on the post page — the ratio matches the slot, otherwise
//          the smart crop is computed for a framing that CSS later crops,
//          and half the bytes are decoded and thrown away
//   card   4:3, 370px in the feed (560 covers 1.5x screens; retina uses cover)
//   thumb   72px in the sidebar and search
//   og     1200x630, the size social networks expect
const VARIANTS = [
  { name: "cover", dir: "", width: 1200, height: 800, ext: "webp", q: 74 },
  { name: "card", dir: "cards", width: 560, height: 420, ext: "webp", q: 74 },
  { name: "thumb", dir: "thumbs", width: 180, height: 135, ext: "webp", q: 72 },
  { name: "og", dir: "og", width: 1200, height: 630, ext: "jpg", q: 70 },
];

const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

// Slugs whose source is a YouTube thumbnail, from _data/videos.yml. Only they
// get letterboxed; regular photos are always cropped.
const VIDEO_SLUGS = new Set();

const FORCE = process.argv.includes("--force");
const PRUNE = process.argv.includes("--prune");

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const outputFor = (slug, v) => path.join(OUT_DIR, v.dir, `${slug}.${v.ext}`);

if (await exists("_data/videos.yml")) {
  const yml = await readFile("_data/videos.yml", "utf8");
  for (const [, slug] of yml.matchAll(/^"([^"]+)":/gm)) VIDEO_SLUGS.add(slug);
}

// path.join uses "\\" on Windows; URLs need "/".
const urlFor = (slug, v) => `/${outputFor(slug, v).split(path.sep).join("/")}`;

const sources = (await exists(SRC_DIR))
  ? (await readdir(SRC_DIR)).filter((f) => SOURCE_EXTENSIONS.has(path.extname(f).toLowerCase())).sort()
  : [];

for (const variant of VARIANTS) {
  await mkdir(path.join(OUT_DIR, variant.dir), { recursive: true });
}

// A source needs work if any variant is missing or if the original was
// modified after the last build.
async function needsWork(slug, input) {
  if (FORCE) return true;

  const src = await stat(input);
  for (const v of VARIANTS) {
    const out = outputFor(slug, v);
    if (!(await exists(out))) return true;
    if ((await stat(out)).mtimeMs < src.mtimeMs) return true;
  }
  return false;
}

// The filename is the only link between photo and post: a typo would
// silently produce four orphan files.
const postSlugs = new Set(
  (await exists("_posts") ? await readdir("_posts") : [])
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, ""))
);

for (const file of sources) {
  const slug = path.basename(file, path.extname(file));
  if (slug !== AVATAR && postSlugs.size && !postSlugs.has(slug)) {
    console.warn(`warning: ${SRC_DIR}/${file} does not match any post in _posts/`);
  }
}

let processed = 0;
let skipped = 0;

for (const file of sources) {
  const slug = path.basename(file, path.extname(file));
  const input = path.join(SRC_DIR, file);

  if (slug === AVATAR) {
    const stale =
      !(await exists(AVATAR_OUT)) ||
      (await stat(AVATAR_OUT)).mtimeMs < (await stat(input)).mtimeMs;

    if (FORCE || stale) {
      // The source is already cropped square; here it is just resized.
      await sharp(input).resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" }).webp({ quality: 86 }).toFile(AVATAR_OUT);
      console.log("avatar optimized");
      processed += 1;
    } else {
      skipped += 1;
    }
    continue;
  }

  if (!(await needsWork(slug, input))) {
    skipped += 1;
    continue;
  }

  /*
   * A YouTube thumbnail cannot be cropped: it is 16:9 and has the title on
   * the edge, which the 4:3 crop chops off. In those cases the whole frame
   * goes in scaled down, over an enlarged, blurred copy of itself.
   *
   * The decision is by slug, not by aspect-ratio difference: a generic
   * threshold also caught the og variant of regular photos (3:2 in a
   * 1200x630 box), changing images that looked fine with the smart crop.
   */
  const letterbox = VIDEO_SLUGS.has(slug);

  for (const variant of VARIANTS) {
    const encode = (p) =>
      variant.ext === "webp" ? p.webp({ quality: variant.q }) : p.jpeg({ quality: variant.q, mozjpeg: true });

    if (letterbox) {
      const background = await encode(
        sharp(input).resize(variant.width, variant.height, { fit: "cover" }).blur(18).modulate({ brightness: 0.72 })
      ).toBuffer();

      // 100% of the box: no side border, since fitting by width (the box is
      // 4:3 and the video is 16:9) makes the frame touch the left and right
      // edges on its own. The vertical slack left is the minimum possible
      // without cropping the frame.
      const inset = 1;
      const foreground = await sharp(input)
        .resize(Math.round(variant.width * inset), Math.round(variant.height * inset), { fit: "inside" })
        .toBuffer();

      await encode(sharp(background).composite([{ input: foreground, gravity: "center" }])).toFile(
        outputFor(slug, variant)
      );
      continue;
    }

    // `position: attention` crops around the highest-contrast region, which
    // tends to preserve the photo's subject better than a center crop.
    await encode(
      sharp(input).resize(variant.width, variant.height, { fit: "cover", position: sharp.strategy.attention })
    ).toFile(outputFor(slug, variant));
  }

  console.log(`optimized ${slug}`);
  processed += 1;
}

if (PRUNE && !sources.length) {
  // With no sources, "everything" is orphaned: pruning here would wipe the whole site.
  console.error(`--prune ignored: ${SRC_DIR}/ is empty. Download the originals before pruning.`);
} else if (PRUNE) {
  const expected = new Set();
  for (const file of sources) {
    const slug = path.basename(file, path.extname(file));
    if (slug === AVATAR) continue;
    for (const v of VARIANTS) expected.add(outputFor(slug, v));
  }

  for (const v of VARIANTS) {
    const dir = path.join(OUT_DIR, v.dir);
    for (const f of await readdir(dir)) {
      const full = path.join(dir, f);
      if ((await stat(full)).isFile() && !expected.has(full)) {
        await rm(full);
        console.log(`pruned ${full}`);
      }
    }
  }
}

/*
 * The map is derived from what is published in assets/, not from the sources
 * that happen to exist on this machine. Otherwise, running the script right
 * after cloning the repository (with an empty `_photos/`) would empty the map
 * and drop the photos of every post.
 */
const base = VARIANTS[0];
const candidates = (await readdir(path.join(OUT_DIR, base.dir)))
  .filter((f) => f.endsWith(`.${base.ext}`))
  .map((f) => path.basename(f, `.${base.ext}`))
  .sort();

// Only slugs with ALL variants on disk go into the map: advertising a path
// that does not exist becomes a 404 on the site.
const published = [];
for (const slug of candidates) {
  const all = await Promise.all(VARIANTS.map((v) => exists(outputFor(slug, v))));
  if (all.every(Boolean)) published.push(slug);
  else console.warn(`skipped in map: ${slug} does not have all variants`);
}

await mkdir("_data", { recursive: true });

await writeFile(
  "_data/photos.yml",
  "# Generated by scripts/build-photos.mjs — do not edit by hand.\n" +
    "# Map post-slug -> cover photo variants.\n" +
    published
      .flatMap((slug) => [
        `${JSON.stringify(slug)}:`,
        ...VARIANTS.map((v) => `  ${v.name}: ${urlFor(slug, v)}`),
      ])
      .join("\n") +
    "\n"
);

await writeFile(
  "_data/site_images.yml",
  "# Generated by scripts/build-photos.mjs — do not edit by hand.\n" +
    ((await exists(AVATAR_OUT)) ? `avatar: /${AVATAR_OUT}\n` : "")
);

console.log(
  `${processed} processed, ${skipped} up to date; ${published.length} published in ${OUT_DIR}`
);
