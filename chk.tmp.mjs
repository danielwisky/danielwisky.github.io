import { chromium } from "playwright";
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto("http://127.0.0.1:4000/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

// skip link aparece no primeiro Tab
await page.keyboard.press("Tab");
const skip = page.locator(".skip-link");
console.log("skip link focado:", await skip.evaluate(el => el === document.activeElement));
console.log("skip link visível:", await skip.isVisible());

// focus trap da busca
await page.click("#search-open");
await page.waitForTimeout(800);
const who = () => page.evaluate(() => document.activeElement?.id || document.activeElement?.className || "?");
console.log("ao abrir, foco em:", await who());
await page.keyboard.press("Tab"); console.log("Tab 1 ->", await who());
await page.keyboard.press("Tab"); console.log("Tab 2 ->", await who());
await page.keyboard.press("Tab"); console.log("Tab 3 ->", await who());
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("após Esc, foco em:", await who());
await b.close();
