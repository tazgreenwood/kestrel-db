# Pre-Release v1.0.0 Checklist

**Target Release Date:** TBD
**Last Updated:** 2025-12-08

---

## 🚨 Critical (Must Fix Before Release)

### 1. TypeScript Error - Unused Import

- [x] **Fix:** Remove unused `noiseTexture` import
  - **File:** `src/renderer/src/components/pages/ConnectionPage.tsx:7`
  - **Action:** Delete line 7: `import noiseTexture from '@renderer/assets/noise.svg'`
  - **Verify:** Run `npm run typecheck` - should pass with no errors

### 2. Auto-Update Configuration

- [x] **Decide:** Choose one of the following options:
  - [ ] **Option A:** Set up real update server and update URL in `electron-builder.yml:43`
  - [ ] **Option B:** Remove auto-update functionality for v1 (comment out `publish` section)
  - [x] **Option C:** Use GitHub Releases as update provider (change to `provider: github`)
- **File:** `electron-builder.yml:42-43`
- **Status:** ✅ Configured to use GitHub Releases

### 3. Third-Party License Attribution

- [x] **Create:** `THIRD_PARTY_LICENSES.md` in project root
- [x] **Include:** Full MIT license text for each theme:
  - [x] Dracula Theme (Copyright © 2023 Dracula Theme)
  - [x] One Dark Pro (Copyright © 2013-2022 Binaryify)
  - [x] Tokyo Night (Copyright © enkia)
- [x] **Add:** Link to this file in README.md under License/Legal section
- [x] **Optional:** Also credit other major dependencies (Electron, React, etc.)

**Template structure:**

```markdown
# Third-Party Licenses and Attributions

## Color Schemes

### Dracula Theme

- Copyright © 2023 Dracula Theme
- License: MIT
- Source: https://github.com/dracula/dracula-theme

[Full MIT license text]

---

### One Dark Pro

- Copyright © 2013-2022 Binaryify
- License: MIT
- Source: https://github.com/Binaryify/OneDark-Pro

[Full MIT license text]

---

### Tokyo Night

- Copyright © enkia
- License: MIT
- Source: https://github.com/enkia/tokyo-night-vscode-theme

[Full MIT license text]
```

---

## ⚡ High Priority (Should Fix)

### 4. Fix Incorrect Comment in themes.ts

- [x] **Fix:** Update comment block for Tokyo Night theme
  - **File:** `src/renderer/src/theme/themes.ts:389-393`
  - **Status:** ✅ Fixed - Comment now correctly says "Tokyo Night Theme"

### 5. Fix TypeScript `any` Types

- [x] **Fix:** Replace `any` types with proper types in:
  - [x] `src/main/database.ts` - Replaced with `Record<string, unknown>[]` and `unknown`
  - [x] `src/preload/index.d.ts` - Added `UpdateInfo` and `UpdateProgress` interfaces
  - [x] `src/preload/index.ts` - Used proper types throughout
- [x] **Verify:** `npm run typecheck` passes after fixes
- **Status:** ✅ All critical `any` types fixed, TypeScript passes with no errors

### 6. Update Linux Maintainer Field

- [x] **Fix:** Change maintainer in electron-builder config
  - **File:** `electron-builder.yml:36`
  - **Status:** ✅ Changed to `tazgreenwood <taz@kestreldb.com>`

### 7. Run Prettier Formatting

- [x] **Run:** `npm run format`
- [x] **Verify:** All Prettier warnings resolved
- **Status:** ✅ All files formatted correctly

---

## 📋 Medium Priority (Nice to Have)

### 8. Create CHANGELOG.md

- [x] **Create:** `CHANGELOG.md` in project root
- [x] **Document:** v1.0.0 release notes
- [x] **Include:** All major features, known limitations
- **Status:** ✅ Comprehensive changelog created with full feature list, technical details, and attribution

**Suggested template:**

```markdown
# Changelog

All notable changes to Kestrel DB will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - YYYY-MM-DD

### Added

- Command palette-driven navigation with Cmd/Ctrl+K
- MySQL connection management with secure credential storage
- Virtualized data grid with sorting and filtering
- Monaco-powered SQL editor with autocomplete
- Table structure viewer with schema, indexes, and constraints
- Query history and saved queries
- CSV and JSON export functionality
- Multiple built-in themes (Dark, High Contrast, Dracula, One Dark Pro, Tokyo Night)
- Custom theme builder
- Cross-platform keyboard shortcuts
- Interactive onboarding tutorial
- Error boundary for graceful error handling

### Known Limitations

- MySQL only (PostgreSQL support planned for v2)
- Read-only operations (data editing planned for future release)
- Auto-update configuration required for production use
```

### 9. Update README.md

- [x] **Fix:** GitHub clone URL
  - **Status:** ✅ Updated to `https://github.com/tazgreenwood/kestrel-db.git`
  - **Also fixed:** CONTRIBUTING.md placeholder to use `your-username` convention
- [x] **Add:** Screenshots and demo GIF
  - [x] Connection page with saved connections (hero image)
  - [x] Demo GIF showing keyboard-first workflow (4.7MB)
  - [x] Data grid with filtering screenshot
  - [x] Command palette search screenshot
  - [x] Command palette filter syntax screenshot
  - **Status:** ✅ Added hero image, animated demo, and 3 feature screenshots

### 10. Verify Version Display

- [x] **Test:** Settings > About shows correct version from package.json
  - **Status:** ✅ Verified - Uses `app.getVersion()` which reads from package.json
  - **Implementation:** `src/main/index.ts:421` correctly returns `app.getVersion()`
  - **Fallback:** Settings modal has `'1.0.0'` fallback which matches current version

---

## 🎯 Optional Enhancements (Post-v1)

### 11. Add Catppuccin Mocha Theme

- [x] **Add:** Catppuccin Mocha color scheme (MIT licensed)
- [x] **Source:** https://github.com/catppuccin/catppuccin
- [x] **Include:** Attribution in THIRD_PARTY_LICENSES.md
- [x] **Test:** Verify all UI elements look good with new theme

### 12. Set Up Basic Testing

- [ ] **Research:** Testing framework (Vitest, Jest, Playwright for E2E)
- [ ] **Add:** At least basic smoke tests
- [ ] **Document:** Testing instructions in CONTRIBUTING.md
- **Note:** Acknowledged as missing in CLAUDE.md, but not critical for v1

---

## ✅ Pre-Release Verification

### Code Quality Checks

- [ ] **Run:** `npm run typecheck` - No errors
- [ ] **Run:** `npm run lint` - No errors
- [ ] **Run:** `npm run format` - All files formatted
- [ ] **Review:** No console.log statements in production code (except main process logging)
- [ ] **Check:** All TODO comments resolved or tracked as issues

### Build Testing

- [ ] **Dev build:** `npm run dev` - App launches and works correctly
- [ ] **Production build:** `npm run build` - Build completes successfully
- [ ] **Unpack test:** `npm run build:unpack` - App runs from build output

### Platform-Specific Builds

- [ ] **macOS:** `npm run build:mac` - .dmg created and tested
- [ ] **Windows:** `npm run build:win` - .exe created and tested (if applicable)
- [ ] **Linux:** `npm run build:linux` - .AppImage/.deb created and tested (if applicable)

### Manual Testing Checklist

- [ ] **Connection:** Successfully connect to MySQL server
- [ ] **Connection:** Secure credential storage works (keytar)
- [ ] **Navigation:** Command palette (Cmd/Ctrl+K) works
- [ ] **Navigation:** All keyboard shortcuts functional
- [ ] **Data Grid:** Load table with 1000+ rows (virtualization)
- [ ] **Data Grid:** Sorting works on all column types
- [ ] **Data Grid:** Filtering with query syntax works
- [ ] **Data Grid:** Vim-style navigation (hjkl) works
- [ ] **SQL Editor:** Monaco editor loads and has autocomplete
- [ ] **SQL Editor:** Query execution works
- [ ] **SQL Editor:** Query history persists
- [ ] **Structure View:** Table schema displays correctly
- [ ] **Export:** CSV export works
- [ ] **Export:** JSON export works
- [ ] **Themes:** All built-in themes display correctly
- [ ] **Themes:** Custom theme builder works
- [ ] **Themes:** Theme import/export works
- [ ] **Settings:** All settings persist after restart
- [ ] **Onboarding:** First-run tutorial displays correctly
- [ ] **Error Handling:** Error boundary catches and displays errors gracefully

### Cross-Platform Testing (if possible)

- [ ] **macOS:** Test on macOS 10.15+ (Catalina or later)
- [ ] **Windows:** Test on Windows 10+
- [ ] **Linux:** Test on Ubuntu/Debian (or other major distro)
- [ ] **Shortcuts:** Verify Cmd/Ctrl modifier key displays correctly per platform

### Documentation Review

- [ ] **README.md:** Accurate and complete
- [ ] **CLAUDE.md:** Up to date with architecture
- [ ] **CONTRIBUTING.md:** Clear contribution guidelines
- [ ] **LICENSE:** Correct (MIT with your copyright)
- [ ] **THIRD_PARTY_LICENSES.md:** All dependencies credited
- [ ] **CHANGELOG.md:** v1.0.0 release documented

---

## 📦 Release Preparation

### Version Bump

- [ ] **Verify:** package.json version is `1.0.0`
- [ ] **Tag:** Create git tag `v1.0.0`
- [ ] **Push:** Push tag to remote: `git push origin v1.0.0`

### Release Assets

- [ ] **Build:** All platform installers (.dmg, .exe, .AppImage, .deb)
- [ ] **Test:** Each installer on respective platform
- [ ] **Sign:** Code sign macOS and Windows builds (if applicable)
- [ ] **Checksums:** Generate SHA256 checksums for all installers

### Release Notes

- [ ] **Write:** Comprehensive release notes
- [ ] **Include:** Installation instructions
- [ ] **Include:** Known issues/limitations
- [ ] **Include:** Credits and acknowledgments
- [ ] **Highlight:** Disclaimer about backup and testing

### Distribution

- [ ] **GitHub Release:** Create release on GitHub
- [ ] **Website:** Update kestreldb.com with download links (if live)
- [ ] **Announce:** Prepare announcement (Twitter, Reddit, HN, etc.)

---

## 🎉 Post-Release

- [ ] **Monitor:** GitHub Issues for bug reports
- [ ] **Prepare:** Issue templates for bugs and feature requests
- [ ] **Plan:** v1.1.0 or v2.0.0 roadmap
- [ ] **Celebrate:** You shipped v1! 🚀

---

## Notes

**Priority Legend:**

- 🚨 **Critical:** Must be fixed, blocks release
- ⚡ **High:** Should be fixed, affects quality
- 📋 **Medium:** Nice to have, polish items
- 🎯 **Optional:** Can be done post-v1

**Decision Log:**

- Auto-update decision: [Record your choice here]
- Platform build targets: [List which platforms you're targeting]
- Testing approach: [Note any testing decisions]

**Blockers:**
[List any blockers preventing release here]

**Target Platforms:**

- [ ] macOS (primary)
- [ ] Windows
- [ ] Linux

---

**Last Review:** [Date]
**Completed:** X / Y items
**Status:** 🔴 Not Ready | 🟡 In Progress | 🟢 Ready
