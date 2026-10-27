// Builds the SVG sprite with the icons the site actually uses.
//
// It used to be three render-blocking cdnjs stylesheets plus two webfonts,
// all to show 24 icons. The sprite is a single local file, cached across
// pages, and none of it blocks painting.
//
// The output is committed; run it only when adding or removing an icon.
//
//   npm run build:icons
//
// The names below are Font Awesome Free (CC BY 4.0) names, and become the
// sprite ids. To use in markup: {% include icon.html name="github" %}

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
    if (!viewBox || !path) throw new Error(`${style}/${name}: could not extract the path`);

    // fill="currentColor" so the icon inherits the text color, as the font did.
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

console.log(`${symbols.length} icons in ${OUT}`);
