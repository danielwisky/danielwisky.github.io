// Baixa a thumbnail do YouTube dos posts que são videoaula.
//
// Um frame do próprio vídeo diz mais que uma foto de banco de imagens, e é a
// imagem que a pessoa já vai reconhecer do YouTube.
//
// A thumbnail entra em `_photos/<slug>.jpg`, ou seja, no mesmo lugar onde
// entrariam as fotos escolhidas à mão: daí em diante quem cuida dela é o
// scripts/build-photos.mjs, com as mesmas quatro variantes. Não há caminho
// especial no site para post de vídeo.
//
// Também escreve _data/videos.yml (slug -> id e URL), que o layout do post usa
// para linkar a capa direto para o vídeo.
//
// Como `_photos/` não é versionada, rodar este script num clone novo devolve
// as thumbnails sem depender de nada guardado no repositório.
//
//   npm run build:videos            baixa o que falta
//   npm run build:videos -- --force rebaixa tudo

import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";

const POSTS_DIR = "_posts";
const OUT_DIR = "_photos";
const FORCE = process.argv.includes("--force");

// Em ordem de preferência: nem todo vídeo tem maxres, e sd é melhor que hq.
const QUALITIES = ["maxresdefault", "sddefault", "hqdefault"];

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const EMBED = /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/;

await mkdir(OUT_DIR, { recursive: true });

const videos = [];

for (const file of (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md")).sort()) {
  const body = await readFile(path.join(POSTS_DIR, file), "utf8");
  const id = body.match(EMBED)?.[1];
  if (!id) continue;

  const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
  videos.push({ slug, id });

  const out = path.join(OUT_DIR, `${slug}.jpg`);
  if (!FORCE && (await exists(out))) continue;

  let saved = false;
  for (const quality of QUALITIES) {
    const res = await fetch(`https://img.youtube.com/vi/${id}/${quality}.jpg`);
    // O YouTube devolve 200 com um placeholder cinza de 120x90 quando a
    // qualidade pedida não existe; o tamanho denuncia.
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) continue;

    await writeFile(out, buf);
    console.log(`${slug}: ${quality} (${(buf.length / 1024).toFixed(0)} KB)`);
    saved = true;
    break;
  }

  if (!saved) console.warn(`aviso: nenhuma thumbnail utilizável para ${slug} (${id})`);
}

await mkdir("_data", { recursive: true });
await writeFile(
  "_data/videos.yml",
  "# Gerado por scripts/build-video-thumbs.mjs — não editar à mão.\n" +
    "# Mapa slug-do-post -> vídeo do YouTube embutido no post.\n" +
    videos
      .flatMap(({ slug, id }) => [
        `${JSON.stringify(slug)}:`,
        `  id: ${id}`,
        `  url: https://www.youtube.com/watch?v=${id}`,
      ])
      .join("\n") +
    "\n"
);

console.log(`${videos.length} vídeo(s) em _data/videos.yml`);
