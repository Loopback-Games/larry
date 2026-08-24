import { chromium, devices } from '@playwright/test';
const browser = await chromium.launch();
const errs = [];
const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 } });
const page = await ctx.newPage();
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await page.goto('http://localhost:4180/larry/', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const stage = await page.$('#stage');
await stage.screenshot({ path: '/tmp/claude-1000/f-title.png' });
await page.keyboard.press('Enter'); await page.waitForTimeout(300);
await page.keyboard.press('Enter'); await page.waitForTimeout(300);
await stage.screenshot({ path: '/tmp/claude-1000/f-quiz.png' });

// Mobile view of the same screen.
const mctx = await browser.newContext({ ...devices['iPhone 13'] });
const mp = await mctx.newPage();
await mp.goto('http://localhost:4180/larry/', { waitUntil: 'networkidle' });
await mp.waitForTimeout(600);
await mp.screenshot({ path: '/tmp/claude-1000/f-mobile.png' });
console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no console errors');
await browser.close();
