import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'main',
    include: ['tests/unit/main/**/*.test.ts', 'tests/integration/ipc/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/setup-main.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/**/*.ts'],
      exclude: ['src/main/index.ts'] // Exclude electron bootstrapping
    }
  },
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@tests': resolve(__dirname, 'tests')
    }
  }
})
