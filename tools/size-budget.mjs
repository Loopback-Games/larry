#!/usr/bin/env node
/**
 * Guard against the bundle quietly growing.
 *
 * The whole point of drawing the art in code is that the game stays small; a
 * regression here usually means an asset crept in or a dependency was added.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET_KB = 90;
const DIR = 'dist/assets';

let total = 0;
const rows = [];
for (const name of readdirSync(DIR)) {
  if (name.endsWith('.map')) continue;
  const path = join(DIR, name);
  if (!statSync(path).isFile()) continue;
  const gz = gzipSync(readFileSync(path)).length;
  total += gz;
  rows.push([name, gz]);
}

for (const [name, gz] of rows.sort((a, b) => b[1] - a[1])) {
  console.log(`  ${(gz / 1024).toFixed(1).padStart(7)} KB gz  ${name}`);
}
const kb = total / 1024;
console.log(`  ${kb.toFixed(1).padStart(7)} KB gz  total (budget ${BUDGET_KB} KB)`);

if (kb > BUDGET_KB) {
  console.error(`\nBundle is ${kb.toFixed(1)} KB gzipped, over the ${BUDGET_KB} KB budget.`);
  process.exit(1);
}
