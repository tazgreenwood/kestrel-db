/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Map font-mono to use our CSS variable for user's selected font
        mono: ['var(--font-family-data)', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
