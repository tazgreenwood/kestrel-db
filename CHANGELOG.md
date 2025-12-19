# Changelog

All notable changes to Kestrel DB will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-10

### Added

#### Core Features

- **Initial MVP release** - Keyboard-first MySQL client for precision data exploration
- **MySQL Connection Management** - Secure credential storage using OS keychain (keytar)
- **Command Palette Navigation** - Press Cmd/Ctrl+K to access all functionality with fuzzy search
- **Multiple Connections** - Save and manage multiple database connections with color coding and tags
- **Virtualized Data Grid** - High-performance table viewing with TanStack Virtual (10,000+ rows)
- **SQL Editor** - Monaco-powered editor with autocomplete for tables, columns, and SQL keywords
- **Table Structure Viewer** - View schemas, indexes, constraints, and column details
- **Query Management** - Save frequently-used queries and view complete query history
- **Data Export** - Export tables and query results to CSV or JSON formats
- **Query Filter Syntax** - Powerful filtering with operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `~`, `!~`
- **Column Sorting** - Click column headers to sort ascending/descending
- **Cell Detail Modal** - View large cell values (JSON, text, UUIDs) in expanded modal
- **First-Run Onboarding** - Interactive tutorial for new users
- **Error Boundary** - Graceful error handling prevents app crashes

#### Themes

- **9 Built-in Themes** with custom theme builder:
  - Dark (default with 5 base color variants: zinc, slate, gray, neutral, stone)
  - High Contrast (WCAG AAA compliant for accessibility)
  - Catppuccin Mocha (soothing pastel theme)
  - Dracula (vibrant purple/pink theme)
  - One Dark Pro (classic Atom theme)
  - Tokyo Night (modern Tokyo nightlife theme)
- **Theme Customization** - Full theme builder with color picker and live preview
- **Theme Import/Export** - Share custom themes via JSON files
- **Data Type Colorization** - Visual distinction for UUIDs, dates, JSON, booleans, hex values

#### Settings & Preferences

- **Appearance** - Font family, font size (12-16px), UI scale (90-120%)
- **Performance** - Configurable chunk size (100-10,000 rows), query timeout, dynamic sizing
- **Display** - Date format (ISO/local/relative), number formatting, animation controls
- **Settings Export/Import** - Backup and restore all settings via JSON
- **Persistent State** - Settings, connections, queries, and themes saved to localStorage

#### Keyboard Shortcuts

- **Cross-Platform Support** - Automatic Cmd/Ctrl detection for macOS and Windows/Linux
- **Complete Keyboard Navigation** - All actions accessible via shortcuts:
  - `Cmd/Ctrl+K` - Open command palette
  - `Cmd/Ctrl+/` - Open SQL editor
  - `Cmd/Ctrl+,` - Open settings
  - `Cmd/Ctrl+R` - Refresh table
  - `Cmd/Ctrl+T` - Toggle data/structure view
  - `Cmd/Ctrl+E` - Export table
  - `h/j/k/l` - Vim-style cell navigation
  - And many more...

#### Auto-Updates

- **GitHub Releases Integration** - Automatic update checking and installation
- **Manual Update Control** - Check, download, and install updates from Settings > About
- **Version Display** - Current version shown in Settings

### Technical Features

- **Electron 38+** - Modern desktop application framework with security best practices
- **React 19** - Latest React features with strict mode and error boundaries
- **TypeScript 5+** - Strict type checking throughout codebase (no `any` types in critical code)
- **Vite 7+** - Fast build tooling with hot module replacement
- **Tailwind CSS v4** - Utility-first styling with CSS custom properties
- **TanStack Table v8** - Headless table library for flexible data display
- **TanStack Virtual** - Virtualization for high-performance large datasets
- **Zustand** - Lightweight state management with persistence middleware
- **Monaco Editor** - VS Code's editor for SQL with autocomplete
- **mysql2** - MySQL client for Node.js with connection pooling
- **keytar** - Secure credential storage using OS keychain
- **electron-updater** - Auto-update functionality via GitHub Releases
- **Lucide React** - Beautiful icon library

### Security

- **Secure Credentials** - Passwords stored in OS keychain, never in plaintext or logs
- **Context Isolation** - Electron security best practices enabled
- **IPC Validation** - All main process calls validated and type-safe
- **No SQL Injection** - Parameterized queries where applicable

### Attribution

This release includes themes inspired by popular color schemes:

- **Catppuccin** (© 2021 Catppuccin) - MIT License
- **Dracula** (© 2023 Dracula Theme) - MIT License
- **One Dark Pro** (© 2013-2022 Binaryify) - MIT License
- **Tokyo Night** (© enkia) - MIT License

See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for complete attributions and license texts.

### Known Limitations

- **MySQL Only** - PostgreSQL and other databases not yet supported (planned for v2)
- **Read-Only** - INSERT, UPDATE, DELETE operations not available in v1
- **No SSH Tunneling** - Direct connections only (SSH tunnel support planned)
- **No SSL/TLS UI** - Secure connections not yet configurable in UI
- **Single Window** - Multiple windows not supported in v1
- **Limited Testing** - Windows and Linux builds less tested than macOS

### Notes

- This is the first public release of Kestrel DB
- Built with ❤️ for developers who prefer keyboard-first workflows
- Open source under MIT License
- Always backup your data before database operations
- Kestrel DB is provided "as is" without warranty - see [LICENSE](LICENSE)

## [Unreleased]

### Planned Features

- PostgreSQL support
- Data editing capabilities (INSERT, UPDATE, DELETE)
- Advanced filtering with WHERE clause builder
- Query result comparison
- Database migration tools
- SSH tunnel support
- SSL/TLS connection options
- Table relationship visualization
- More export formats (Excel, SQL)
- Query execution plan visualization
- Database performance monitoring
- Dark theme variants and more built-in themes
- Window management (multiple windows, tabs)
- Backup and restore functionality
