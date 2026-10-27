// Generates the posts' SVG covers.
//
// Posts have no artwork of their own, so each cover is derived from the post's
// FIRST tag: an icon (TAG_ICONS) and the tag name, centered over a gradient
// whose hue is fixed per tag (TAG_HUES), with a subtle grid in the background.
//
// The output is committed, in the same spirit as build-js.mjs — the GitHub
// Pages workflow only runs Jekyll. Run `npm run build:covers` when adding a
// new tag (and, ideally, give it a hue and an icon in the tables below).

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ICONS } from "./cover-icons.mjs";

const POSTS_DIR = "_posts";
const OUT_DIR = "assets/img/covers";

const WIDTH = 1200;
const HEIGHT = 900;

// og:image must be a bitmap (social networks ignore SVG) and 1200x630 is the
// ratio Facebook, LinkedIn, WhatsApp and X display without cropping anything.
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Icon for each tag. The key is the tag slug; the value is a key of ICONS.
// Tags with no entry here fall back to the generic `code` icon.
const TAG_ICONS = {
  java: "java",
  solid: "cubes",
  docker: "docker",
  mongodb: "mongodb",
  nosql: "mongodb",
  redis: "redis",
  dynamodb: "dynamodb",
  sass: "sass",
  css: "sass",
  jquery: "jquery",
  javascript: "jquery",
  html5: "html5",
  "web-storage": "html5",
  "apache-kafka": "kafka",
  "sistemas-de-mensageria": "kafka",
  maven: "maven",
  "gerenciamento-de-dependencias": "maven",
  commits: "git",
  "clean-code": "broom",
  "clean-architecture": "cubes",
  "design-pattern": "puzzle",
  "estruturas-de-dados": "sitemap",
  "busca-binaria": "search",
  "algoritmos-de-busca": "search",
  "desafio-de-programacao": "trophy",
  programacao: "laptop",
  "aprendizado-continuo": "graduation",
  doutorado: "graduation",
  "educacao-superior": "graduation",
  seguranca: "shield",
  coletanea: "layers",
  "sites-educacionais": "book",
  "aplicativos-para-acessibilidade": "book",
  "inteligencia-artificial": "robot",
  cursor: "robot",
  "claude-code": "robot",
  "impressao-3d": "cubes",
  arquitetura: "cubes",
  terminal: "laptop",
  "banco-de-dados": "database",
};

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// FNV-1a: short, stable hash, no dependencies.
const hash = (value) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
};

const escapeXml = (value) =>
  value.replace(/[<>&'"]/g, (c) => `&${{ "<": "lt", ">": "gt", "&": "amp", "'": "apos", '"': "quot" }[c]};`);

// Hue for each tag, in degrees. It comes from the brand color where there is
// one (Java orange, Docker blue, Redis red...) and is hand-picked for the rest,
// so no two tags land on similar shades. The hash is only a fallback for new
// tags that have not been added here yet.
const TAG_HUES = {
  java: 28,
  solid: 218,
  docker: 205,
  mongodb: 120,
  nosql: 132,
  redis: 4,
  dynamodb: 232,
  sass: 330,
  css: 318,
  jquery: 262,
  javascript: 52,
  html5: 14,
  "web-storage": 20,
  "apache-kafka": 248,
  "sistemas-de-mensageria": 240,
  maven: 348,
  "gerenciamento-de-dependencias": 340,
  commits: 40,
  "clean-code": 174,
  "clean-architecture": 145,
  "design-pattern": 272,
  "estruturas-de-dados": 199,
  "busca-binaria": 36,
  "algoritmos-de-busca": 32,
  "desafio-de-programacao": 62,
  programacao: 212,
  "aprendizado-continuo": 292,
  doutorado: 282,
  "educacao-superior": 288,
  seguranca: 0,
  coletanea: 160,
  "sites-educacionais": 152,
  "aplicativos-para-acessibilidade": 100,
  "inteligencia-artificial": 258,
  cursor: 252,
  "claude-code": 24,
  "impressao-3d": 190,
  arquitetura: 80,
  terminal: 305,
  "banco-de-dados": 222,
};

// The gradient always rotates the hue backwards (-12°, -20°) as it darkens.
// The direction matters: going forward, warm hues pass through yellow and, in
// the dark, turn olive/brown. Going back, orange turns red and yellow turns
// amber — which stay vivid. Fixed saturation and lightness keep the family
// cohesive even with hues far apart from each other.
const wrapHue = (h) => (h + 360) % 360;

function palette(seed, slug) {
  const base = TAG_HUES[slug] ?? hash(seed) % 360;

  // Yellow and gold (38°–78°) do not survive low lightness: they turn olive.
  // In that range the gradient darkens less and saturates more, and the result
  // reads as gold/bronze instead of moss green.
  const gold = base >= 38 && base <= 78;

  return {
    start: `hsl(${base}, ${gold ? 86 : 76}%, ${gold ? 56 : 52}%)`,
    end: `hsl(${wrapHue(base - 12)}, ${gold ? 82 : 72}%, ${gold ? 45 : 36}%)`,
    deep: `hsl(${wrapHue(base - 20)}, ${gold ? 76 : 66}%, ${gold ? 34 : 24}%)`,
  };
}

// Wraps the label into at most two lines, so long tags like
// "Desafio de Programação" do not overflow the cover.
function wrap(label, maxChars = 16) {
  const words = label.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  if (lines.length > 2) {
    console.warn(`warning: "${label}" does not fit in 2 lines and will be truncated on the cover`);
  }

  return lines.slice(0, 2);
}

// Centers the icon path in a `size` px square, at point (cx, cy).
function iconMarkup(iconKey, cx, cy, size) {
  const icon = ICONS[iconKey] || ICONS.code;
  const scale = size / Math.max(icon.w, icon.h);
  const x = cx - (icon.w * scale) / 2;
  const y = cy - (icon.h * scale) / 2;

  return (
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(4)})" ` +
    `fill="#ffffff" fill-opacity="0.92"><path d="${icon.d}"/></g>`
  );
}

function coverSvg(label, iconKey, slug, width = WIDTH, height = HEIGHT) {
  const { start, end, deep } = palette(label, slug);
  const lines = wrap(label.toUpperCase());
  const fontSize = lines.some((l) => l.length > 12) ? 64 : 78;

  /*
   * Centers the icon + text group as a single block, instead of centering
   * each part on its own (which left the icon too high).
   *
   * With no text layout in SVG, line heights are estimated: Roboto Mono's
   * cap height is ~0.72em, and the visual body of a line takes up
   * ~1.15em.
   */
  const ICON_SIZE = 170;
  const GAP = 44;
  const capHeight = fontSize * 0.72;
  const lineHeight = fontSize * 1.15;
  const textHeight = capHeight + (lines.length - 1) * lineHeight;

  const blockTop = (height - (ICON_SIZE + GAP + textHeight)) / 2;
  const icon = iconMarkup(iconKey, width / 2, blockTop + ICON_SIZE / 2, ICON_SIZE);
  const firstBaseline = blockTop + ICON_SIZE + GAP + capHeight;

  const text = lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${(firstBaseline + i * lineHeight).toFixed(1)}" text-anchor="middle" ` +
        `font-family="'Roboto Mono',monospace" font-size="${fontSize}" font-weight="700" ` +
        `letter-spacing="4" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="55%" stop-color="${end}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0v48" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="0.22" cy="0.18" r="0.85">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  ${icon}
  <g>
    ${text}
  </g>
  <rect x="0" y="${height - 10}" width="${width}" height="10" fill="#ffffff" fill-opacity="0.25"/>
</svg>
`;
}

// Thumbnail: same gradient, icon only, no text.
//
// Reusing the large cover at 72px does not work — the tag name becomes
// illegible and it all turns into a blur. Here the icon fills half the frame.
function thumbSvg(label, iconKey, slug) {
  const { start, end, deep } = palette(label, slug);
  const w = 400;
  const h = 300;
  const icon = iconMarkup(iconKey, w / 2, h / 2, h * 0.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="55%" stop-color="${end}"/>
      <stop offset="100%" stop-color="${deep}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${icon}
</svg>
`;
}

function avatarSvg(initials) {
  const { start, end } = palette(initials, "avatar");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeXml(initials)}">
  <defs>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${start}"/>
      <stop offset="100%" stop-color="${end}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#a)"/>
  <text x="200" y="248" text-anchor="middle" font-family="'Poppins',sans-serif"
    font-size="160" font-weight="700" letter-spacing="4" fill="#ffffff">${escapeXml(initials)}</text>
</svg>
`;
}

// Extracts the first tag from the front matter, accepting both YAML forms
// (`tags: [A, B]` and a hyphen list).
function firstTag(source) {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatter) return null;

  const inline = frontMatter[1].match(/^tags:\s*\[(.+)\]\s*$/m);
  if (inline) {
    const first = inline[1].split(",")[0].trim().replace(/^["']|["']$/g, "");
    return first || null;
  }

  const block = frontMatter[1].match(/^tags:\s*\r?\n\s*-\s*(.+)$/m);
  if (block) return block[1].trim().replace(/^["']|["']$/g, "");

  return null;
}

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md"));
const tags = new Map();

for (const file of files) {
  const tag = firstTag(await readFile(path.join(POSTS_DIR, file), "utf8"));
  if (tag) tags.set(slugify(tag), tag);
}

// Rebuilds the directory from scratch so removed tags leave no orphan covers.
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

await mkdir(path.join(OUT_DIR, "thumbs"), { recursive: true });
await mkdir(path.join(OUT_DIR, "og"), { recursive: true });

// JPEG rather than PNG: the gradient becomes 25 KB instead of 162 KB, and the
// difference is invisible on a social media card.
const writeOg = async (label, iconKey, slug) => {
  const svg = coverSvg(label, iconKey, slug, OG_WIDTH, OG_HEIGHT);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(OUT_DIR, "og", `${slug}.jpg`));
};

for (const [slug, label] of tags) {
  const iconKey = TAG_ICONS[slug] || "code";
  await writeFile(path.join(OUT_DIR, `${slug}.svg`), coverSvg(label, iconKey, slug));
  await writeFile(path.join(OUT_DIR, "thumbs", `${slug}.svg`), thumbSvg(label, iconKey, slug));
  await writeOg(label, iconKey, slug);
}

await writeFile(path.join(OUT_DIR, "default.svg"), coverSvg("Blog", "code", "default"));
await writeFile(path.join(OUT_DIR, "thumbs", "default.svg"), thumbSvg("Blog", "code", "default"));
await writeOg("Blog", "code", "default");
await writeFile("assets/img/avatar.svg", avatarSvg("DW"));

// Home screen icons (iOS and manifest.webmanifest). Outside OUT_DIR, which is
// wiped on every build. PNG because neither iOS nor Android accept SVG here.
const APP_DIR = "assets/img/app";
await mkdir(APP_DIR, { recursive: true });
const APP_ICONS = { "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };
for (const [name, size] of Object.entries(APP_ICONS)) {
  await sharp(Buffer.from(avatarSvg("DW")), { density: (72 * size) / 400 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(APP_DIR, name));
}

// Tag -> cover map, consumed by Liquid in _includes/post-cover.html.
// A data file avoids relying on Jekyll's `slugify` (which keeps accents)
// matching the ASCII slug used in the filename.
const yaml = [
  "# Gerado por scripts/build-covers.mjs — não editar à mão.",
  ...[...tags.entries()]
    // Plain comparison rather than localeCompare: the order must be the same
    // on every machine, otherwise the generated file differs between your
    // environment and CI's.
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([slug, label]) => [
      `${JSON.stringify(label)}:`,
      `  cover: /${OUT_DIR}/${slug}.svg`,
      `  card: /${OUT_DIR}/${slug}.svg`,
      `  thumb: /${OUT_DIR}/thumbs/${slug}.svg`,
      `  og: /${OUT_DIR}/og/${slug}.jpg`,
    ]),
  "",
].join("\n");

await mkdir("_data", { recursive: true });
await writeFile("_data/covers.yml", yaml);

console.log(`built ${tags.size + 1} covers in ${OUT_DIR}, _data/covers.yml, assets/img/avatar.svg and ${APP_DIR}`);
