import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await page.goto('http://localhost:4180/larry/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

async function clear() {
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(120); }
}
async function shot(name) {
  await page.waitForTimeout(300);
  const el = await page.$('#stage');
  await el.screenshot({ path: `/tmp/claude-1000/${name}.png` });
}
async function cmd(text) {
  await page.fill('#command', text);
  await page.press('#command', 'Enter');
  await page.waitForTimeout(250);
}

await clear();
await shot('r-outside');

// Walk into the bar through the doorway.
await cmd('');
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(1500);
await page.keyboard.up('ArrowUp');
await clear();
await shot('r-inside');

await cmd('buy whiskey');
await shot('r-whiskey');
await clear();
await cmd('score');
await shot('r-score');

console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors');
await browser.close();
