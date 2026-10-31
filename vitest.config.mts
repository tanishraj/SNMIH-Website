import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./tests/helpers/server-only.ts', import.meta.url)),
    },
  },
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // jsdom start-up dominated CI time when every file paid for it. Component tests (.tsx)
    // get jsdom; plain .ts tests run in node unless they opt in with `// @vitest-environment jsdom`.
    projects: [
      {
        extends: true,
        test: { name: 'dom', environment: 'jsdom', include: ['tests/int/**/*.int.spec.tsx'] },
      },
      {
        extends: true,
        test: { name: 'node', environment: 'node', include: ['tests/int/**/*.int.spec.ts'] },
      },
    ],
  },
})
