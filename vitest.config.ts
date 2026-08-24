import { defineConfig } from 'vitest/config';

/**
 * Unit and integration tests only. The `e2e/` directory belongs to Playwright,
 * which has its own runner; collecting those files here fails with a confusing
 * "did not expect test.beforeEach()" error.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
