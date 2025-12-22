import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'renderer',
    include: [
      'tests/unit/renderer/**/*.test.{ts,tsx}',
      'tests/component/**/*.test.{ts,tsx}',
      'tests/integration/stores/**/*.test.ts'
    ],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup/setup-renderer.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/renderer/src/**/*.{ts,tsx}'],
      exclude: [
        'src/renderer/src/main.tsx', // Entry point
        'src/renderer/src/**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@tests': resolve(__dirname, 'tests')
    }
  }
})
