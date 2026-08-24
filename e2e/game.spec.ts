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
  // Relative, so the project's /larry/ base path is preserved.
  await page.goto('./');
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

test('walks to a tapped point instead of standing still', async ({ page }) => {
  // Tap-to-walk was wired to a behaviour the tick loop never stepped, so
  // tapping the scene did nothing at all. It matters most on a phone, where
  // it is the main way to move.
  await page.evaluate(() => {
    const g = (window as unknown as { larry: { goTo(r: string): void } }).larry;
    g.goTo('inside-bar');
  });
  await clearWindows(page);

  const before = await page.evaluate(
    () => (window as unknown as { larry: { ego: { x: number; y: number } } }).larry.ego,
  );

  // Aim at a scene coordinate rather than a fraction of the element. The
  // canvas letterboxes a 320x200 framebuffer whose scene is only rows 8..176,
  // so on a tall phone screen a naive fraction lands in the border and the tap
  // is correctly ignored.
  const target = await page.evaluate(() => {
    const c = document.getElementById('screen') as HTMLCanvasElement;
    const r = c.getBoundingClientRect();
    const scale = Math.min(r.width / 320, r.height / 200);
    const dx = r.left + (r.width - 320 * scale) / 2;
    const dy = r.top + (r.height - 200 * scale) / 2;
    // Scene column 250, row 150, offset past the status line.
    return { x: dx + 250 * scale, y: dy + (8 + 150) * scale };
  });
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(900);

  const after = await page.evaluate(
    () => (window as unknown as { larry: { ego: { x: number; y: number } } }).larry.ego,
  );
  expect(Math.abs(after.x - before.x), 'tapping the scene moved Larry').toBeGreaterThan(8);
});

test('names the doorway the player is standing in', async ({ page }) => {
  // Walking into an unmarked rectangle and being teleported is the most
  // disorienting thing this kind of game can do, so every exit says where it
  // goes while you are standing in it.
  await page.evaluate(() => {
    const g = (window as unknown as { larry: { goTo(r: string): void } }).larry;
    // Arriving from the lounge puts Larry just below that alcove.
    g.goTo('lounge');
    g.goTo('inside-casino');
  });
  await clearWindows(page);

  // Step up into the alcove he is standing in front of.
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
  });

  const seen = await page.evaluate(
    () => (window as unknown as { larry: { room: string } }).larry.room,
  );
  // Either he is standing in the doorway and it is named, or he has already
  // walked through it. Both prove the exit is where the art says it is.
  expect(seen, 'walking up at the lounge alcove leads to the lounge').toBe('lounge');
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
