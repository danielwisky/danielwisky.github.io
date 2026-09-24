// Otimiza as fotos de capa dos posts.
//
// Fluxo: largue o original em `_photos/<slug-do-post>.jpg` (ou .png/.webp) e
// rode `npm run build:photos`. O slug é o nome do arquivo do post sem a data,
// então `_posts/2023-01-16-clean-code-funcoes.md` recebe
// `_photos/clean-code-funcoes.jpg`. É esse nome que amarra a foto ao post: o
// mapa em _data/photos.yml é indexado por ele, e _includes/post-cover.html o
// consulta antes de cair na capa gerada a partir da tag.
//
// O script é INCREMENTAL: só processa fontes cuja saída ainda não existe (ou
// está mais velha que o original). Na prática, ao publicar um post novo só a
// foto dele é processada; as antigas nem são tocadas.
//
// Isso importa porque `_photos/` não é versionada — os originais são pesados e
// recuperáveis. Num clone novo a pasta nem existe, e o script precisa ser
// inofensivo nesse caso.
//
//   npm run build:photos             processa o que falta
//   npm run build:photos -- --force  reprocessa tudo (ao mudar as dimensões)
//   npm run build:photos -- --prune  remove saídas sem original correspondente
//                                    (só com o conjunto completo em mãos)
//
// `_photos/` começa com underscore: o Jekyll não publica a pasta, só as
// versões otimizadas em assets/ vão para o site.

import { readdir, readFile, writeFile, mkdir, rm, access, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "_photos";
const OUT_DIR = "assets/img/photos";

// Nome reservado: `_photos/avatar.*` não é capa de post, é a foto do hero.
// Sai quadrada em 2x (o hero exibe 132px) e vai para um mapa próprio.
const AVATAR = "avatar";
const AVATAR_OUT = "assets/img/avatar.webp";
const AVATAR_SIZE = 264;

// Cada variante existe porque algum lugar do site a exibe num tamanho
// diferente. Servir 1200px para um card de 370px era o que mais pesava, daí a
// variante `card`, que o srcset entrega no lugar da `cover`.
//
//   cover  3:2, 712px na página do post — a proporção casa com o slot, senão
//          o recorte inteligente é calculado para um enquadramento que o CSS
//          depois corta, e metade dos bytes é decodificada e jogada fora
//   card   4:3, 370px no feed (560 cobre telas 1.5x; retina cai na cover)
//   thumb   72px na sidebar e na busca
//   og     1200x630, tamanho que as redes sociais esperam
const VARIANTS = [
  { name: "cover", dir: "", width: 1200, height: 800, ext: "webp", q: 74 },
  { name: "card", dir: "cards", width: 560, height: 420, ext: "webp", q: 74 },
  { name: "thumb", dir: "thumbs", width: 180, height: 135, ext: "webp", q: 72 },
  { name: "og", dir: "og", width: 1200, height: 630, ext: "jpg", q: 70 },
];

const SOURCE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

// Slugs cuja fonte é thumbnail do YouTube, de _data/videos.yml. Só eles
// recebem letterbox; foto comum é sempre recortada.
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

// path.join usa "\\" no Windows; URL precisa de "/".
const urlFor = (slug, v) => `/${outputFor(slug, v).split(path.sep).join("/")}`;

const sources = (await exists(SRC_DIR))
  ? (await readdir(SRC_DIR)).filter((f) => SOURCE_EXTENSIONS.has(path.extname(f).toLowerCase())).sort()
  : [];

for (const variant of VARIANTS) {
  await mkdir(path.join(OUT_DIR, variant.dir), { recursive: true });
}

// Uma fonte precisa de trabalho se falta alguma variante ou se o original foi
// modificado depois da última geração.
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

// O nome do arquivo é o único vínculo entre foto e post: um typo geraria
// quatro arquivos órfãos em silêncio.
const postSlugs = new Set(
  (await exists("_posts") ? await readdir("_posts") : [])
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, ""))
);

for (const file of sources) {
  const slug = path.basename(file, path.extname(file));
  if (slug !== AVATAR && postSlugs.size && !postSlugs.has(slug)) {
    console.warn(`aviso: ${SRC_DIR}/${file} não corresponde a nenhum post em _posts/`);
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
      // A fonte já vem recortada em quadrado; aqui é só redimensionar.
      await sharp(input).resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" }).webp({ quality: 86 }).toFile(AVATAR_OUT);
      console.log("avatar otimizado");
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
   * Thumbnail de YouTube não pode ser recortada: é 16:9 e tem o título na
   * borda, que o corte 4:3 decepa. Nesses casos o quadro inteiro entra
   * reduzido, sobre uma cópia ampliada e desfocada de si mesmo.
   *
   * A decisão é por slug, e não por diferença de proporção: um limiar
   * genérico pegava também a variante og das fotos comuns (3:2 numa caixa
   * 1200x630), mudando imagens que estavam boas com o recorte inteligente.
   */
  const letterbox = VIDEO_SLUGS.has(slug);

  for (const variant of VARIANTS) {
    const encode = (p) =>
      variant.ext === "webp" ? p.webp({ quality: variant.q }) : p.jpeg({ quality: variant.q, mozjpeg: true });

    if (letterbox) {
      const background = await encode(
        sharp(input).resize(variant.width, variant.height, { fit: "cover" }).blur(18).modulate({ brightness: 0.72 })
      ).toBuffer();

      // 96% da caixa: borda fina só pra não encostar no fundo desfocado e
      // parecer corte. Em 86% a borda ficava grande demais, sobretudo em
      // cima/baixo (a caixa é 4:3 e o vídeo é 16:9, então o encaixe por
      // largura já deixa uma sobra vertical; um inset menor só piorava isso).
      const inset = 0.96;
      const foreground = await sharp(input)
        .resize(Math.round(variant.width * inset), Math.round(variant.height * inset), { fit: "inside" })
        .toBuffer();

      await encode(sharp(background).composite([{ input: foreground, gravity: "center" }])).toFile(
        outputFor(slug, variant)
      );
      continue;
    }

    // `position: attention` recorta em volta da região de maior contraste, o
    // que costuma preservar o assunto da foto melhor que um corte central.
    await encode(
      sharp(input).resize(variant.width, variant.height, { fit: "cover", position: sharp.strategy.attention })
    ).toFile(outputFor(slug, variant));
  }

  console.log(`otimizada ${slug}`);
  processed += 1;
}

if (PRUNE && !sources.length) {
  // Sem nenhuma fonte, "tudo" é órfão: podar aqui apagaria o site inteiro.
  console.error(`--prune ignorado: ${SRC_DIR}/ está vazia. Baixe os originais antes de podar.`);
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
        console.log(`podada ${full}`);
      }
    }
  }
}

/*
 * O mapa é derivado do que está publicado em assets/, e não das fontes que por
 * acaso existem nesta máquina. Sem isso, rodar o script logo após clonar o
 * repositório (com `_photos/` vazia) esvaziaria o mapa e derrubaria as fotos
 * de todos os posts.
 */
const base = VARIANTS[0];
const candidates = (await readdir(path.join(OUT_DIR, base.dir)))
  .filter((f) => f.endsWith(`.${base.ext}`))
  .map((f) => path.basename(f, `.${base.ext}`))
  .sort();

// Só entra no mapa quem tem TODAS as variantes em disco: anunciar um caminho
// que não existe vira 404 no site.
const published = [];
for (const slug of candidates) {
  const all = await Promise.all(VARIANTS.map((v) => exists(outputFor(slug, v))));
  if (all.every(Boolean)) published.push(slug);
  else console.warn(`ignorada no mapa: ${slug} não tem todas as variantes`);
}

await mkdir("_data", { recursive: true });

await writeFile(
  "_data/photos.yml",
  "# Gerado por scripts/build-photos.mjs — não editar à mão.\n" +
    "# Mapa slug-do-post -> variantes da foto de capa.\n" +
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
  "# Gerado por scripts/build-photos.mjs — não editar à mão.\n" +
    ((await exists(AVATAR_OUT)) ? `avatar: /${AVATAR_OUT}\n` : "")
);

console.log(
  `${processed} processada(s), ${skipped} já em dia; ${published.length} publicada(s) em ${OUT_DIR}`
);
