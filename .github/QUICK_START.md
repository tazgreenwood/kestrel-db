# CI/CD Quick Start

## 🎯 What You Get

When you push these changes to GitHub, you'll have:

✅ **Automatic Testing** - 282 tests run on every PR
✅ **Automatic Releases** - Merge to main = instant release
✅ **Multi-Platform Builds** - macOS, Windows, Linux
✅ **Zero Configuration** - Works immediately

---

## 📝 Daily Workflow

### Making Changes:

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make your changes
# ... code ...

# 3. Commit
git add .
git commit -m "feat: add new feature"

# 4. Push
git push origin feature/my-feature

# 5. Create PR on GitHub
# ✅ CI automatically runs tests

# 6. Merge PR when tests pass
# ✅ Nothing happens yet - just merged to main
```

### Creating a Release:

```bash
# Option 1: Manual version bump
npm version patch  # 1.0.0 → 1.0.1
git push && git push --tags

# Option 2: Just push to main (uses current version)
git push origin main

# ✅ Release workflow automatically:
# - Builds for macOS, Windows, Linux
# - Creates GitHub Release
# - Uploads installers
```

---

## 🚀 First Time Setup

### Step 1: Push to GitHub

```bash
git add .
git commit -m "ci: add CI/CD workflows"
git push origin main
```

### Step 2: Watch It Work

1. Go to your repo on GitHub
2. Click **"Actions"** tab
3. See the workflows running!
4. Check **"Releases"** tab for builds

### Step 3: Download & Test

- Go to the latest release
- Download the installer for your platform
- Test it works!

---

## 🔧 Common Tasks

### Run Tests Locally (Before Pushing):

```bash
npm run typecheck  # Type check
npm run lint       # Lint check
npm run test:renderer  # Run renderer tests
npm run test:main      # Run main tests
npm run build      # Build app
```

### Create a New Release:

```bash
# Update version
npm version patch  # or: minor, major

# Push with tags
git push && git push --tags

# That's it! Builds start automatically
```

### View Release Progress:

1. Go to GitHub → Actions tab
2. Click on the running workflow
3. See build progress for each platform
4. Download artifacts when complete

---

## 📦 What Gets Released

Each release includes:

### macOS:

- `kestrel-db-1.0.0.dmg` - Drag & drop installer
- Universal binary (Intel + Apple Silicon)

### Windows:

- `kestrel-db-1.0.0-setup.exe` - NSIS installer
- Auto-update enabled

### Linux:

- `kestrel-db-1.0.0.AppImage` - Portable
- `kestrel-db-1.0.0.deb` - Ubuntu/Debian
- `kestrel-db-1.0.0.snap` - Snap store

---

## 🎨 Good Commit Messages

The workflow generates release notes from commits. Use these prefixes:

```bash
feat: add new feature       # New features
fix: resolve bug            # Bug fixes
docs: update docs           # Documentation
perf: improve performance   # Performance
refactor: restructure code  # Refactoring
test: add tests            # Tests
chore: update dependencies  # Maintenance
ci: update workflows       # CI/CD changes
```

**Examples:**

```bash
git commit -m "feat: add PostgreSQL support"
git commit -m "fix: resolve connection timeout issue"
git commit -m "docs: update installation guide"
```

---

## ⚠️ Known Limitations (Without Code Signing)

**macOS:**

- Users see: "App is from an unidentified developer"
- Fix: Right-click → Open → Open
- Later: Add code signing ($99/year Apple Developer)

**Windows:**

- Users see: "Windows protected your PC"
- Fix: Click "More info" → "Run anyway"
- Later: Add code signing (~$200/year certificate)

**Linux:**

- No warnings! Works perfectly unsigned

---

## 🆘 Troubleshooting

### Tests Fail in CI But Pass Locally:

- Check workflow logs in Actions tab
- Often caused by environment differences
- Verify Node.js version matches (v20)

### Release Not Created:

- Check if workflow ran: Actions tab
- Verify version in package.json changed
- Check workflow logs for errors

### Build Fails on Specific Platform:

- Check platform-specific logs in Actions tab
- Common issues: native dependencies, build tools
- Try building locally on that platform first

---

## 📚 Next Steps

### Now (Zero Config):

✅ CI/CD is working!
✅ Tests run automatically
✅ Releases are automated
⚠️ Apps are unsigned (users see warnings)

### Later (Production Ready):

1. Add code signing certificates (see CICD_SETUP.md)
2. Enable app notarization (macOS)
3. Set up auto-update server (optional)
4. Add custom app icons (optional)

---

## 💡 Pro Tips

1. **Test Before Releasing**
   - Create PRs to test CI without releasing
   - Merge to `develop` branch to test without releasing to main

2. **Version Strategy**
   - Use `patch` for bug fixes (1.0.0 → 1.0.1)
   - Use `minor` for new features (1.0.0 → 1.1.0)
   - Use `major` for breaking changes (1.0.0 → 2.0.0)

3. **Release Frequency**
   - Don't worry about creating too many releases
   - GitHub releases are free and unlimited
   - Users only see the latest version in auto-updater

4. **Monitor Releases**
   - Watch GitHub Discussions for user feedback
   - Check GitHub Issues for bug reports
   - Monitor download stats in Releases tab

---

## 🎉 You're All Set!

Your CI/CD pipeline is ready to use **right now** with zero configuration!

**Next commit you make will:**

- ✅ Run all 282 tests automatically
- ✅ Create installers for all platforms
- ✅ Publish to GitHub Releases
- 🚀 Be available for users to download

**Just commit and push - it's that easy!**
