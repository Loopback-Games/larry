import { chromium, devices } from '@playwright/test';
const url = process.argv[2] ?? 'http://localhost:4180/larry/';
const browser = await chromium.launch();

const errors = [];
async function shot(name, opts, steps) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (steps) await steps(page);
  await page.screenshot({ path: `/tmp/claude-1000/${name}.png` });
  await ctx.close();
}

await shot('desktop', { viewport: { width: 1280, height: 860 } });
await shot('desktop-play', { viewport: { width: 1280, height: 860 } }, async (page) => {
  // Dismiss the opening messages, then look around.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.fill('#command', 'look at the neon');
  await page.press('#command', 'Enter');
  await page.waitForTimeout(400);
});
await shot('mobile', { ...devices['iPhone 13'] });

console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
