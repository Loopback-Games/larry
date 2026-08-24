import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();
await page.goto('http://localhost:4180/larry/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const c = document.getElementById('screen');
  const stage = document.getElementById('stage');
  const r = c.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  return {
    dpr: window.devicePixelRatio,
    backing: [c.width, c.height],
    cssBox: [Math.round(r.width), Math.round(r.height)],
    boxAspect: +(r.width / r.height).toFixed(3),
    backingAspect: +(c.width / c.height).toFixed(3),
    stageBox: [Math.round(sr.width), Math.round(sr.height)],
    appRows: getComputedStyle(document.getElementById('app')).gridTemplateRows,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
