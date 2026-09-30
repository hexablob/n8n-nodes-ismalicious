import { createRequire } from 'node:module'

import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)

export default defineConfig({
  root: '.',
  resolve: {
    // The CommonJS build n8n itself loads the compiled node against. The ESM
    // build ships `.js` files without `"type": "module"`, so Vitest would
    // inline and transform all of it on every run.
    alias: { 'n8n-workflow': require.resolve('n8n-workflow') },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
