// Otimiza as fotos de capa dos posts.
//
// Fluxo: largue o original em `_photos/<slug-do-post>.jpg` (ou .png/.webp) e
// rode `npm run build:photos`. O slug é o nome do arquivo do post sem a data,
// então `_posts/2023-01-16-clean-code-funcoes.md` recebe
// `_photos/clean-code-funcoes.jpg`.
//
// Daí saem três variantes, nas mesmas proporções das capas geradas, e um mapa
// em _data/photos.yml. O _includes/post-cover.html consulta esse mapa antes de
// cair na capa gerada a partir da tag, então nenhum front matter precisa mudar.
//
// `_photos/` começa com underscore: o Jekyll não publica a pasta, só as
// versões otimizadas em assets/ vão para o site.

import { readdir, writeFile, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "_photos";
const OUT_DIR = "assets/img/photos";

// Nome reservado: `_photos/avatar.*` não é capa de post, é a foto do hero.
// Sai quadrada em 2x (o hero exibe 132px) e vai para um mapa próprio.
const AVATAR = "avatar";
const AVATAR_OUT = "assets/img/avatar.webp";
const AVATAR_SIZE = 264;

// Mesmas proporções das capas geradas, para os layouts não precisarem saber
// de onde a imagem veio.
const VARIANTS = [
  { name: "cover", dir: "", width: 1200, height: 900, ext: "webp" },
  { name: "thumb", dir: "thumbs", width: 400, height: 300, ext: "webp" },
  { name: "og", dir: "og", width: 1200, height: 630, ext: "jpg" },
];

const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const sources = (await exists(SRC_DIR))
  ? (await readdir(SRC_DIR)).filter((f) => SOURCE_EXTENSIONS.has(path.extname(f).toLowerCase()))
  : [];

const writeMap = async (body) => {
  await mkdir("_data", { recursive: true });
  await writeFile("_data/photos.yml", `# Gerado por scripts/build-photos.mjs — não editar à mão.\n${body}`);
};

// A limpeza vem antes de qualquer saída antecipada: se a pasta some ou fica
// vazia, as versões otimizadas e o mapa precisam sumir junto, senão o site
// continua servindo a foto de um post que já não a tem.
await rm(OUT_DIR, { recursive: true, force: true });

if (!sources.length) {
  await rm(AVATAR_OUT, { force: true });
  await writeFile("_data/site_images.yml", "# Gerado por scripts/build-photos.mjs — não editar à mão.\n");
  await writeMap("");
  console.log(`nenhuma foto em ${SRC_DIR}/ — assets/img/photos e o mapa foram limpos`);
  process.exit(0);
}

for (const variant of VARIANTS) {
  await mkdir(path.join(OUT_DIR, variant.dir), { recursive: true });
}

const entries = [];
let avatar = null;

for (const file of sources.sort()) {
  const slug = path.basename(file, path.extname(file));
  const input = path.join(SRC_DIR, file);

  if (slug === AVATAR) {
    // A fonte já vem recortada em quadrado; aqui é só redimensionar.
    await sharp(input).resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" }).webp({ quality: 86 }).toFile(AVATAR_OUT);
    avatar = `/${AVATAR_OUT}`;
    console.log("avatar otimizado");
    continue;
  }

  const paths = {};

  for (const variant of VARIANTS) {
    const out = path.join(OUT_DIR, variant.dir, `${slug}.${variant.ext}`);

    // `position: attention` recorta em volta da região de maior contraste, o
    // que costuma preservar o assunto da foto melhor que um corte central.
    const pipeline = sharp(input).resize(variant.width, variant.height, {
      fit: "cover",
      position: sharp.strategy.attention,
    });

    await (variant.ext === "webp"
      ? pipeline.webp({ quality: 80 })
      : pipeline.jpeg({ quality: 82, mozjpeg: true })
    ).toFile(out);

    paths[variant.name] = `/${out}`;
  }

  entries.push([slug, paths]);
  console.log(`otimizada ${slug}`);
}

await writeMap(
  entries
    .flatMap(([slug, paths]) => [
      `${JSON.stringify(slug)}:`,
      ...VARIANTS.map((v) => `  ${v.name}: ${paths[v.name]}`),
    ])
    .join("\n") + "\n"
);

await writeFile(
  "_data/site_images.yml",
  "# Gerado por scripts/build-photos.mjs — não editar à mão.\n" +
    (avatar ? `avatar: ${avatar}\n` : "")
);

console.log(`${entries.length} foto(s) em ${OUT_DIR} e _data/photos.yml`);
