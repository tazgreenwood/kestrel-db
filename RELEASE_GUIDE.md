# Release Guide

This guide walks you through publishing a new version of Kestrel DB using GitHub Releases for auto-updates.

## Prerequisites

### 1. GitHub Personal Access Token

Create a token with `repo` scope:

1. Go to: https://github.com/settings/tokens/new
2. Token name: `Kestrel DB Release Token`
3. Expiration: 1 year (or your preference)
4. Scopes: Select **only** `repo`
5. Click "Generate token"
6. Copy the token immediately (you won't see it again!)

### 2. Set Token as Environment Variable

**macOS/Linux:**

```bash
# Add to ~/.zshrc or ~/.bashrc
export GH_TOKEN="ghp_your_token_here"

# Reload your shell
source ~/.zshrc  # or source ~/.bashrc
```

**Windows (PowerShell):**

```powershell
# Temporary (current session)
$env:GH_TOKEN="ghp_your_token_here"

# Permanent (add to profile)
[Environment]::SetEnvironmentVariable("GH_TOKEN", "ghp_your_token_here", "User")
```

**Verify token is set:**

```bash
echo $GH_TOKEN  # Should show your token
```

---

## Release Process

### Step 1: Prepare the Release

1. **Update version** in `package.json`:

   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **Update CHANGELOG.md** with release notes:

   ```markdown
   ## [1.0.1] - 2025-12-XX

   ### Fixed

   - Bug fixes here

   ### Added

   - New features here
   ```

3. **Commit changes:**

   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.0.1"
   git push origin main
   ```

4. **Create and push git tag:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

### Step 2: Build and Publish

**Option A: Publish for macOS only (your platform)**

```bash
npm run publish:mac
```

**Option B: Publish for all platforms**

```bash
npm run publish:all
```

**What happens:**

- Code is type-checked and built
- Installers are created (.dmg, .exe, .AppImage, .deb, etc.)
- A GitHub Release is created automatically with tag `v1.0.1`
- All installers are uploaded as release assets
- `latest.yml` (macOS) / `latest-mac.yml` / `latest-linux.yml` files are uploaded for update checks

### Step 3: Edit Release on GitHub

1. Go to: https://github.com/tazgreenwood/kestrel-db/releases
2. Find your new release (should be a draft or already published)
3. **Edit the release notes** to add:
   - What's new
   - Bug fixes
   - Installation instructions
   - Known issues (if any)
4. Check "Set as the latest release"
5. Click "Publish release" (if draft) or "Update release"

---

## How Auto-Updates Work

### For Users

1. **Check for updates:**
   - User clicks "Check for Updates" in Settings > About
   - Or app checks automatically on startup (if configured)

2. **Download update:**
   - If new version available, user clicks "Download Update"
   - Progress bar shows download status

3. **Install update:**
   - User clicks "Install and Restart"
   - App quits, installs update, and relaunches

### Technical Details

- **Update checks** query GitHub Releases API for latest version
- **Updates are verified** using signatures (if code signing is enabled)
- **Only major versions** can be set to require updates (configurable)
- **Update files:**
  - `latest-mac.yml` - macOS update metadata
  - `latest.yml` - Windows update metadata
  - `latest-linux.yml` - Linux update metadata

---

## Platform-Specific Notes

### macOS

**Code Signing (Recommended):**

```bash
# Set signing identity (for notarization)
export CSC_LINK="path/to/cert.p12"
export CSC_KEY_PASSWORD="cert-password"
export APPLE_ID="your-apple-id@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

**Without code signing:**

- Users need to right-click > Open first time
- Updates still work, but less trusted

### Windows

**Code Signing (Recommended):**

```bash
export CSC_LINK="path/to/cert.pfx"
export CSC_KEY_PASSWORD="cert-password"
```

**Without code signing:**

- Windows SmartScreen may warn users
- Updates still work

### Linux

- No code signing needed
- Multiple formats: AppImage (portable), deb (Debian/Ubuntu), snap (universal)
- AppImage is most portable

---

## Troubleshooting

### "No GitHub token found"

**Solution:**

```bash
# Check if token is set
echo $GH_TOKEN

# If not set, add to shell profile
export GH_TOKEN="ghp_your_token_here"
source ~/.zshrc
```

### "Release already exists"

**Solution:**
Delete the existing release and tag:

```bash
# Delete remote tag
git push --delete origin v1.0.1

# Delete local tag
git tag -d v1.0.1

# Create new tag
git tag v1.0.1
git push origin v1.0.1

# Rebuild and publish
npm run publish:mac
```

### "Build failed"

**Solution:**

```bash
# Clean build artifacts
rm -rf out dist

# Verify dependencies
npm install

# Run type check first
npm run typecheck

# Try building without publishing first
npm run build:mac
```

### "Update check fails in app"

**Checklist:**

- [ ] Is the release published (not draft)?
- [ ] Does the release have the correct tag format (`v1.0.1`)?
- [ ] Are the `latest-*.yml` files uploaded?
- [ ] Is the app version in package.json correct?

---

## Release Checklist

Before publishing a release:

- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] All changes committed and pushed to main
- [ ] Git tag created and pushed
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `GH_TOKEN` environment variable is set
- [ ] Tested the build locally with `npm run build:mac`

After publishing:

- [ ] Verify release appears on GitHub
- [ ] Download and test the installer
- [ ] Edit release notes on GitHub
- [ ] Mark as "latest release"
- [ ] Test auto-update from previous version
- [ ] Announce the release (Twitter, website, etc.)

---

## Advanced: Pre-release / Beta Versions

For beta releases that shouldn't trigger auto-updates:

1. **Use a pre-release version:**

   ```json
   {
     "version": "1.1.0-beta.1"
   }
   ```

2. **Tag as pre-release:**

   ```bash
   git tag v1.1.0-beta.1
   git push origin v1.1.0-beta.1
   ```

3. **Publish:**

   ```bash
   npm run publish:mac
   ```

4. **Mark as pre-release on GitHub:**
   - Edit the release
   - Check "Set as a pre-release"
   - Users won't auto-update to this

---

## Quick Reference

### Common Commands

```bash
# Check version
npm version

# Bump patch version (1.0.0 -> 1.0.1)
npm version patch

# Bump minor version (1.0.0 -> 1.1.0)
npm version minor

# Bump major version (1.0.0 -> 2.0.0)
npm version major

# Build for testing
npm run build:mac

# Publish release
npm run publish:mac

# View releases
open https://github.com/tazgreenwood/kestrel-db/releases
```

### npm version command

The `npm version` command is convenient as it:

- Updates package.json
- Creates a git commit
- Creates a git tag
- All in one command!

Example workflow:

```bash
# Update CHANGELOG.md first
vim CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: update changelog"

# Bump version (creates commit + tag)
npm version patch -m "chore: bump version to %s"

# Push with tags
git push --follow-tags

# Publish
npm run publish:mac
```

---

## Security Notes

### Protecting Your Token

**Never:**

- Commit `GH_TOKEN` to git
- Share your token publicly
- Use personal tokens in CI/CD (use repo secrets)

**If token is compromised:**

1. Revoke it immediately on GitHub
2. Generate a new token
3. Update your environment variable
4. Rotate any potentially affected releases

### Code Signing

For production releases, code signing is highly recommended:

- **macOS:** Notarization prevents "unidentified developer" warnings
- **Windows:** Authenticode signing prevents SmartScreen warnings
- **Cost:** Requires paid developer accounts ($99/yr macOS, ~$200-400 Windows)

---

## Support

If you encounter issues:

1. Check [electron-builder docs](https://www.electron.build/)
2. Check [electron-updater docs](https://www.electron.build/auto-update)
3. Review GitHub Issues for similar problems
4. Check app logs (Help > Show Logs, if implemented)

## Resources

- [electron-builder Configuration](https://www.electron.build/configuration/configuration)
- [electron-updater Guide](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Code Signing Guide](https://www.electron.build/code-signing)
