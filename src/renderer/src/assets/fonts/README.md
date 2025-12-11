# Bundled Fonts

This directory contains fonts that are bundled with the application to ensure consistent typography across all platforms.

## JetBrains Mono

**Download Instructions:**

1. Visit: https://www.jetbrains.com/lp/mono/
2. Click "Download font"
3. Extract the ZIP file
4. Copy these files from `fonts/webfonts/` to this directory:
   - `JetBrainsMono-Regular.woff2`
   - `JetBrainsMono-Bold.woff2`
   - `JetBrainsMono-Italic.woff2`

**License:** JetBrains Mono is licensed under the OFL-1.1 (SIL Open Font License)

- Free for personal and commercial use
- License file included in the download

## Alternative: Use CDN (Not Recommended for Electron)

You could also load from Google Fonts, but bundling is better for:

- Offline support
- Faster load times
- No external dependencies
- Privacy (no external requests)

## File Size

Total size: ~150KB for all 3 font files (woff2 format is very efficient)
