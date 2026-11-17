import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const entries = [
  { in: "assets/js/main.js", out: "assets/js/main.min.js" },
  { in: "assets/js/search.js", out: "assets/js/search.min.js" },
  { in: "assets/js/code-blocks.js", out: "assets/js/code-blocks.min.js" },
  { in: "assets/js/contact.js", out: "assets/js/contact.min.js" },
  { in: "assets/js/tags.js", out: "assets/js/tags.min.js" },
];

// Search dependencies, served from the site itself instead of two CDNs: if
// either was down, search broke. Versions are pinned in package.json.
const VENDOR_DIR = "assets/js/vendor";
const vendor = [
  "node_modules/lunr/lunr.min.js",
  "node_modules/lunr-languages/min/lunr.stemmer.support.min.js",
  "node_modules/lunr-languages/min/lunr.pt.min.js",
];

for (const entry of entries) {
  const code = await readFile(entry.in, "utf8");
  const result = await minify(code, { compress: true, mangle: true });
  await writeFile(entry.out, result.code + "\n");
  console.log(`built ${entry.out}`);
}

await mkdir(VENDOR_DIR, { recursive: true });
for (const file of vendor) {
  const out = `${VENDOR_DIR}/${file.split("/").pop()}`;
  await copyFile(file, out);
  console.log(`copied ${out}`);
}
