# Contributing to Kestrel DB

Thank you for your interest in contributing to Kestrel DB! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project follows a standard code of conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- MySQL 8.0+ (for testing database connections)
- macOS, Windows, or Linux development environment

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kestrel-db.git
   cd kestrel-db
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/tazgreenwood/kestrel-db.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Stable release branch
- `develop` - Development branch (if used)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a New Feature

1. **Update your main branch**:

   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit regularly with clear messages

4. **Keep your branch updated**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict type checking
- Avoid `any` types - use `unknown` or proper types
- Use interfaces for object shapes, types for unions/intersections

### React Components

- Use functional components with hooks
- Use `React.JSX.Element` for return types
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use `useCallback` and `useMemo` for performance optimization

### Naming Conventions

- **Components**: PascalCase (e.g., `DataGrid`, `CommandPalette`)
- **Files**: Match component name (e.g., `DataGrid.tsx`)
- **Functions**: camelCase (e.g., `handleConnect`, `fetchTableData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_CHUNK_SIZE`)
- **Interfaces**: PascalCase with descriptive names (e.g., `ConnectionConfig`)

### Code Style

This project uses Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Check for linting issues
npm run lint
```

**Key style points**:

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multiline objects/arrays
- Max line length: 100 characters (flexible)

### File Organization

```
src/
├── main/              # Main process (Electron)
├── preload/           # Preload scripts
└── renderer/
    └── src/
        ├── components/    # React components
        │   ├── data/      # Data display components
        │   ├── layout/    # Layout components
        │   ├── modals/    # Modal dialogs
        │   └── ui/        # Reusable UI components
        ├── store/         # Zustand stores
        ├── theme/         # Theme configuration
        ├── types/         # TypeScript type definitions
        └── utils/         # Utility functions
```

## Testing

### Type Checking

Always run type checking before committing:

```bash
npm run typecheck
```

For specific targets:

```bash
npm run typecheck:node   # Main/preload processes
npm run typecheck:web    # Renderer process
```

### Manual Testing

1. Test the feature in development mode (`npm run dev`)
2. Build and test the packaged app (`npm run build:unpack`)
3. Test on multiple platforms if possible
4. Verify keyboard shortcuts work as expected
5. Test with different themes if UI changes are involved

## Submitting Changes

### Pull Request Process

1. **Ensure your code passes all checks**:

   ```bash
   npm run typecheck
   npm run lint
   npm run format
   ```

2. **Update documentation** if needed:
   - Update README.md for new features
   - Add/update JSDoc comments
   - Update CHANGELOG.md

3. **Create a pull request** with:
   - Clear title describing the change
   - Description explaining what and why
   - Reference any related issues
   - Screenshots/GIFs for UI changes

4. **Respond to feedback** promptly and make requested changes

### Commit Messages

Use clear, descriptive commit messages following this format:

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```
feat: add PostgreSQL connection support

Implements PostgreSQL driver integration with the existing
connection manager. Includes auto-detection of postgres:// URLs
and appropriate credential handling.

Closes #123
```

```
fix: prevent command palette from closing on Escape in input

The command palette was incorrectly closing when pressing Escape
while typing in the search input. Now Escape only clears the input
or closes the palette if input is already empty.
```

## Reporting Bugs

### Before Submitting a Bug Report

1. Check if the bug has already been reported in Issues
2. Try to reproduce the bug in the latest version
3. Collect relevant information (OS, version, steps to reproduce)

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- OS: [e.g. macOS 13.0]
- Kestrel DB Version: [e.g. 1.0.0]
- MySQL Version: [e.g. 8.0.32]

**Additional context**
Any other relevant information.
```

## Feature Requests

We welcome feature requests! Please provide:

1. **Use case**: Describe the problem you're trying to solve
2. **Proposed solution**: How you envision the feature working
3. **Alternatives**: Other solutions you've considered
4. **Additional context**: Screenshots, mockups, examples from other tools

## Project-Specific Guidelines

### Working with Zustand Stores

- Keep stores focused and domain-specific
- Use selectors for reading state to prevent unnecessary re-renders
- Document store actions with JSDoc comments
- Persist only necessary data

### Theming

- Use theme variables from `theme/types.ts`
- Test changes with both light and dark themes
- Ensure high contrast mode works properly
- Use semantic color names, not specific colors

### Keyboard Shortcuts

- Document new shortcuts in README.md
- Avoid conflicts with existing shortcuts
- Test on both macOS (Cmd) and Windows/Linux (Ctrl)
- Support both Vim-style and arrow key navigation where appropriate

### Performance Considerations

- Use virtualization for large data sets
- Debounce/throttle expensive operations
- Memoize expensive calculations
- Profile performance before and after changes

## Questions?

If you have questions that aren't covered here:

1. Check existing Issues and Discussions
2. Ask in a new Discussion thread
3. Reach out to maintainers

Thank you for contributing to Kestrel DB!
