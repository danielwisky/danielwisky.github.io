// Gera as capas SVG dos posts.
//
// Os posts não têm arte própria, então cada capa é derivada da PRIMEIRA tag do
// post: um ícone (TAG_ICONS) e o nome da tag, centralizados sobre um gradiente
// cujo matiz é fixo por tag (TAG_HUES), com um grid discreto ao fundo.
//
// A saída é commitada, no mesmo espírito do build-js.mjs — o workflow do
// GitHub Pages roda só o Jekyll. Rode `npm run build:covers` ao adicionar uma
// tag nova (e, de preferência, dê a ela um matiz e um ícone nas tabelas abaixo).

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ICONS } from "./cover-icons.mjs";

const POSTS_DIR = "_posts";
const OUT_DIR = "assets/img/covers";

const WIDTH = 1200;
const HEIGHT = 900;

// og:image precisa ser bitmap (redes sociais ignoram SVG) e 1200x630 é a
// proporção que Facebook, LinkedIn, WhatsApp e X recortam sem cortar nada.
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Ícone de cada tag. A chave é o slug da tag; o valor é uma chave de ICONS.
// Tag sem entrada aqui cai no ícone genérico `code`.
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
  "boas-praticas-de-commits": "git",
  "clean-code": "broom",
  "clean-architecture": "cubes",
  "arquitetura-limpa": "cubes",
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
};

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// FNV-1a: hash estável e curto, sem dependências.
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

// Matiz de cada tag, em graus. Vem da cor da marca onde existe uma (Java
// laranja, Docker azul, Redis vermelho...) e é escolhido à mão nas demais,
// para nenhum par de tags cair em tons parecidos. O hash só entra como
// fallback para tags novas, que ainda não passaram por aqui.
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
  "boas-praticas-de-commits": 46,
  "clean-code": 174,
  "clean-architecture": 145,
  "arquitetura-limpa": 141,
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
};

// O gradiente sempre gira o matiz para trás (-12°, -20°) enquanto escurece.
// A direção importa: avançando, matizes quentes passam pelo amarelo e, no
// escuro, viram oliva/marrom. Recuando, laranja vira vermelho e amarelo vira
// âmbar — que continuam vivos. Saturação e luminosidade fixas mantêm a
// família coesa mesmo com matizes bem distantes entre si.
const wrapHue = (h) => (h + 360) % 360;

function palette(seed, slug) {
  const base = TAG_HUES[slug] ?? hash(seed) % 360;

  // Amarelo e dourado (38°–78°) não sobrevivem a lightness baixa: viram oliva.
  // Nessa faixa o gradiente escurece menos e satura mais, e o resultado lê
  // como ouro/bronze em vez de verde-musgo.
  const gold = base >= 38 && base <= 78;

  return {
    start: `hsl(${base}, ${gold ? 86 : 76}%, ${gold ? 56 : 52}%)`,
    end: `hsl(${wrapHue(base - 12)}, ${gold ? 82 : 72}%, ${gold ? 45 : 36}%)`,
    deep: `hsl(${wrapHue(base - 20)}, ${gold ? 76 : 66}%, ${gold ? 34 : 24}%)`,
  };
}

// Quebra o rótulo em no máximo duas linhas, para tags longas como
// "Desafio de Programação" não vazarem da capa.
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
    console.warn(`aviso: "${label}" não cabe em 2 linhas e será truncado na capa`);
  }

  return lines.slice(0, 2);
}

// Centraliza o path do ícone num quadrado de `size` px, no ponto (cx, cy).
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
   * Centraliza o conjunto ícone + texto como um bloco só, em vez de centralizar
   * cada parte isoladamente (o que deixava o ícone alto demais).
   *
   * Sem layout de texto no SVG, a altura das linhas é estimada: a altura de
   * caixa alta do Roboto Mono é ~0,72em, e o miolo visual de uma linha ocupa
   * ~1,15em.
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

// Miniatura: mesmo gradiente, só o ícone, sem texto.
//
// Reaproveitar a capa grande em 72px não funciona — o nome da tag fica
// ilegível e o conjunto vira um borrão. Aqui o ícone ocupa metade do quadro.
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

// Extrai a primeira tag do front matter, tolerando as duas formas do YAML
// (`tags: [A, B]` e lista com hífen).
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

// Regera o diretório do zero para que tags removidas não deixem capas órfãs.
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

await mkdir(path.join(OUT_DIR, "thumbs"), { recursive: true });
await mkdir(path.join(OUT_DIR, "og"), { recursive: true });

// JPEG e não PNG: o gradiente vira 25 KB em vez de 162 KB, e a diferença é
// invisível num card de rede social.
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

// Mapa tag -> capa, consumido pelo Liquid em _includes/post-cover.html.
// Um arquivo de dados evita depender de o `slugify` do Jekyll (que preserva
// acentos) coincidir com o slug ASCII usado no nome do arquivo.
const yaml = [
  "# Gerado por scripts/build-covers.mjs — não editar à mão.",
  ...[...tags.entries()]
    // Comparação simples e não localeCompare: a ordem precisa ser a mesma
    // em qualquer máquina, senão o arquivo gerado difere entre o seu
    // ambiente e o do CI.
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

console.log(`built ${tags.size + 1} covers in ${OUT_DIR}, _data/covers.yml and assets/img/avatar.svg`);
