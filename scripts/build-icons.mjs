// Monta o sprite SVG com os ícones que o site realmente usa.
//
// Antes eram três CSS do cdnjs bloqueando a renderização mais dois webfonts,
// tudo para exibir 24 ícones. O sprite é um único arquivo local, cacheado
// entre páginas, e nada disso bloqueia a pintura.
//
// A saída é commitada; rode só ao adicionar ou remover um ícone.
//
//   npm run build:icons
//
// Os nomes abaixo são os do Font Awesome Free (CC BY 4.0), e viram os ids do
// sprite. Para usar no markup: {% include icon.html name="github" %}

import { writeFile, mkdir } from "node:fs/promises";

const OUT = "assets/img/icons.svg";
const BASE = "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/svgs";

const ICONS = {
  solid: [
    "arrow-left", "arrow-right", "arrow-up", "check", "copy", "cube",
    "flag-checkered", "heart-crack", "magnifying-glass", "moon", "paper-plane",
    "play", "sun", "tag", "xmark",
  ],
  brands: [
    "facebook-f", "github", "instagram", "linkedin", "linkedin-in",
    "reddit-alien", "whatsapp", "x-twitter", "youtube",
  ],
};

const symbols = [];

for (const [style, names] of Object.entries(ICONS)) {
  for (const name of names) {
    const res = await fetch(`${BASE}/${style}/${name}.svg`);
    if (!res.ok) throw new Error(`${style}/${name}: HTTP ${res.status}`);

    const svg = await res.text();
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
    const path = svg.match(/ d="([^"]+)"/)?.[1];
    if (!viewBox || !path) throw new Error(`${style}/${name}: não consegui extrair o path`);

    // fill="currentColor" para o ícone herdar a cor do texto, como a fonte fazia.
    symbols.push(
      `  <symbol id="${name}" viewBox="${viewBox}"><path fill="currentColor" d="${path}"/></symbol>`
    );
  }
}

await mkdir("assets/img", { recursive: true });
await writeFile(
  OUT,
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <!-- Gerado por scripts/build-icons.mjs. Ícones do Font Awesome Free (CC BY 4.0). -->
${symbols.join("\n")}
</svg>
`
);

console.log(`${symbols.length} ícones em ${OUT}`);
