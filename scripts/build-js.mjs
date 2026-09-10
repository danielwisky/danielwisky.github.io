import { readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const entries = [
  { in: "assets/js/main.js", out: "assets/js/main.min.js" },
  { in: "assets/js/contact.js", out: "assets/js/contact.min.js" },
];

for (const entry of entries) {
  const code = await readFile(entry.in, "utf8");
  const result = await minify(code, { compress: true, mangle: true });
  await writeFile(entry.out, result.code + "\n");
  console.log(`built ${entry.out}`);
}
