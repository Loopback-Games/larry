/**
 * Load the game's TypeScript modules from a plain Node script.
 *
 * The dev tools need the real `ROOMS` table, which means resolving TypeScript
 * and the `./x.js` specifiers that point at `./x.ts`. Node's own type stripping
 * does not rewrite those extensions, so it cannot load this source tree.
 *
 * Vitest used to bundle `vite-node` and the tools shelled out to it; Vitest 4
 * dropped it, which left `npx vite-node` quietly fetching an unpinned package
 * on every CI run. Vite is already a dependency and exposes the same thing
 * directly, so use that and add nothing.
 */
import { createServer } from 'vite';

/**
 * Run `body` with a loader that imports modules from the source tree.
 *
 * @param {(load: (path: string) => Promise<Record<string, unknown>>) => Promise<void>} body
 */
export async function withSource(body) {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true, watch: null },
    optimizeDeps: { noDiscovery: true },
  });
  try {
    await body((path) => server.ssrLoadModule(path));
  } finally {
    await server.close();
  }
}
