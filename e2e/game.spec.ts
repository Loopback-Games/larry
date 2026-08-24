import { test, expect, type Page } from '@playwright/test';

/** Read the game's own state out of the page for assertions. */
async function state(page: Page) {
  return page.evaluate(() => {
    const g = (window as unknown as { larry?: Record<string, unknown> }).larry;
    if (!g) throw new Error('game handle not exposed');
    return g as unknown as {
      room: string;
      score: number;
      message: string[] | null;
      inventory: string[];
    };
  });
}

/** Dismiss every open text window. */
async function clearWindows(page: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const s = await state(page);
    if (!s.message) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
  }
}

async function type(page: Page, line: string): Promise<void> {
  await clearWindows(page);
  await page.fill('#command', line);
  await page.press('#command', 'Enter');
  await page.waitForTimeout(120);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  (page as unknown as { __errors: string[] }).__errors = errors;
  await page.goto('/');
  await page.waitForFunction(() => document.getElementById('app')?.dataset.state === 'ready');
});

test.afterEach(async ({ page }) => {
  const errors = (page as unknown as { __errors: string[] }).__errors ?? [];
  expect(errors, 'page logged no errors').toEqual([]);
});

test('boots to the title card and renders the canvas', async ({ page }) => {
  await expect(page.locator('#screen')).toBeVisible();
  const s = await state(page);
  expect(s.room).toBe('title');
  expect(s.score).toBe(0);

  // The canvas is actually painting, not just present.
  const painted = await page.evaluate(() => {
    const c = document.getElementById('screen') as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let lit = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] + data[i + 1] + data[i + 2] > 60) lit++;
    }
    return lit;
  });
  expect(painted).toBeGreaterThan(1000);
});

test('the canvas keeps its aspect ratio and stays inside its box', async ({ page }) => {
  const box = await page.evaluate(() => {
    const c = document.getElementById('screen') as HTMLCanvasElement;
    const stage = document.getElementById('stage')!;
    const r = c.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    return {
      backingAspect: c.width / c.height,
      cssAspect: r.width / r.height,
      insideStage: r.width <= sr.width + 1 && r.height <= sr.height + 1,
      documentScrolls: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  // Backing store matches the element box, so pixels stay square.
  expect(Math.abs(box.backingAspect - box.cssAspect)).toBeLessThan(0.02);
  expect(box.insideStage).toBe(true);
  expect(box.documentScrolls).toBe(false);
});

test('plays through the opening and scores the first point', async ({ page }) => {
  await type(page, '');
  expect((await state(page)).room).toBe('age-check');

  // Answer the door until it opens.
  for (let i = 0; i < 15; i++) {
    const s = await state(page);
    if (s.room !== 'age-check') break;
    const answer = await page.evaluate(() => {
      const g = (window as unknown as { larry: { quizAnswer(): string } }).larry;
      return g.quizAnswer();
    });
    await type(page, answer);
  }
  await clearWindows(page);
  expect((await state(page)).room).toBe('outside-bar');

  await type(page, 'look at the neon');
  await clearWindows(page);

  // Walk in through the door and buy a drink.
  await page.evaluate(() => {
    const g = (window as unknown as { larry: { goTo(r: string): void } }).larry;
    g.goTo('inside-bar');
  });
  await clearWindows(page);
  await type(page, 'buy whiskey');
  await clearWindows(page);

  const s = await state(page);
  expect(s.room).toBe('inside-bar');
  expect(s.score).toBe(1);
  expect(s.inventory).toContain('whiskey');
});

test('accepts touch input on the movement pad', async ({ page }) => {
  await type(page, '');
  for (let i = 0; i < 15; i++) {
    const s = await state(page);
    if (s.room !== 'age-check') break;
    const answer = await page.evaluate(() => {
      const g = (window as unknown as { larry: { quizAnswer(): string } }).larry;
      return g.quizAnswer();
    });
    await type(page, answer);
  }
  await clearWindows(page);

  const before = await page.evaluate(() => {
    const g = (window as unknown as { larry: { ego: { x: number; y: number } } }).larry;
    return { ...g.ego };
  });
  await page.locator('.pad.left').dispatchEvent('pointerdown', { pointerId: 1 });
  await page.waitForTimeout(500);
  await page.locator('.pad.left').dispatchEvent('pointerup', { pointerId: 1 });
  const after = await page.evaluate(() => {
    const g = (window as unknown as { larry: { ego: { x: number; y: number } } }).larry;
    return { ...g.ego };
  });
  expect(after.x).toBeLessThan(before.x);
});

test('offers word chips that build a command', async ({ page }) => {
  await type(page, '');
  for (let i = 0; i < 15; i++) {
    const s = await state(page);
    if (s.room !== 'age-check') break;
    const answer = await page.evaluate(() => {
      const g = (window as unknown as { larry: { quizAnswer(): string } }).larry;
      return g.quizAnswer();
    });
    await type(page, answer);
  }
  await clearWindows(page);

  const chips = page.locator('.chip');
  await expect(chips.first()).toBeVisible();
  expect(await chips.count()).toBeGreaterThan(4);

  await page.locator('.chip', { hasText: 'look at' }).first().click();
  await expect(page.locator('#command')).toHaveValue('look at');
});

test('saves and restores progress', async ({ page }) => {
  await page.evaluate(() => {
    const g = (window as unknown as { larry: { goTo(r: string): void } }).larry;
    g.goTo('inside-bar');
  });
  await clearWindows(page);
  await type(page, 'buy whiskey');
  await clearWindows(page);
  expect((await state(page)).score).toBe(1);

  await page.evaluate(() => {
    (window as unknown as { larry: { save(): boolean } }).larry.save();
  });
  await page.reload();
  await page.waitForFunction(() => document.getElementById('app')?.dataset.state === 'ready');
  expect((await state(page)).score).toBe(0);

  await page.evaluate(() => {
    (window as unknown as { larry: { restore(): boolean } }).larry.restore();
  });
  await clearWindows(page);
  const s = await state(page);
  expect(s.score).toBe(1);
  expect(s.room).toBe('inside-bar');
});
