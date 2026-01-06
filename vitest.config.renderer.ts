import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.svg'],
  test: {
    name: 'renderer',
    include: [
      'tests/unit/renderer/**/*.test.{ts,tsx}',
      'tests/component/**/*.test.{ts,tsx}',
      'tests/integration/stores/**/*.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // TODO: Fix SVG asset imports
      '**/tests/unit/renderer/components/CommandPalette.test.tsx'
    ],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup/setup-renderer.ts'],
    server: {
      deps: {
        inline: ['@renderer/assets/kestrel-logo.svg']
      }
    },
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
      '@tests': resolve(__dirname, 'tests'),
      // Mock SVG imports for tests
      '@renderer/assets/kestrel-logo.svg': resolve(__dirname, 'tests/mocks/svg.mock.ts')
    }
  }
})
