# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kestrel DB is a modern, keyboard-first MySQL client built as an Electron desktop application with React and TypeScript using electron-vite as the build tool.

**Tagline**: Precision Data Exploration

**Version**: 1.0.0 (MVP)
**License**: MIT
**Author**: Taz Greenwood

Kestrel emphasizes speed, precision, and keyboard-first navigation through command palette-driven interactions. The application is designed for developers and database administrators who prefer keyboard shortcuts over mouse interactions.

## Key Features

- **Command Palette-Driven Navigation** - Press Cmd+K to access all functionality
- **SQL Editor** - Monaco-powered editor with autocomplete for tables, columns, and SQL keywords
- **Data Grid** - Virtualized table view with sorting, filtering, and cell navigation
- **Structure View** - View table schemas, indexes, constraints, and relationships
- **Query Management** - Save frequently-used queries and view history
- **Export** - Export tables and query results to CSV or JSON
- **Theme System** - Customizable themes with built-in dark theme
- **Multiple Connections** - Manage and switch between multiple database connections
- **Secure Credentials** - Uses keytar for secure credential storage
- **First-Run Onboarding** - Interactive tutorial for new users
- **Error Boundary** - Graceful error handling to prevent app crashes

## Architecture

This is a standard Electron application with three main process types:

### Main Process (`src/main/`)

- Entry point: `src/main/index.ts`
- Handles window creation, app lifecycle, and native OS integration
- Uses `@electron-toolkit/utils` for common Electron utilities
- IPC communication setup via `ipcMain`

### Preload Script (`src/preload/`)

- Bridge between main and renderer processes: `src/preload/index.ts`
- Exposes Electron APIs to renderer via `contextBridge`
- Custom APIs defined in the `api` object
- Type definitions in `src/preload/index.d.ts`

### Renderer Process (`src/renderer/`)

- React application with TypeScript
- Entry point: `src/renderer/src/main.tsx`
- Main component: `src/renderer/src/App.tsx`
- Uses `@renderer` path alias that resolves to `src/renderer/src/`

## Build System

Uses electron-vite with separate configurations for:

- **Main process**: Node.js environment with externalized dependencies
- **Preload**: Node.js environment with externalized dependencies
- **Renderer**: Browser environment with Vite + React plugin

Configuration file: `electron.vite.config.ts`

## TypeScript Configuration

Project uses TypeScript project references:

- `tsconfig.json` - Root config with references to node and web configs
- `tsconfig.node.json` - For main and preload processes (Node environment)
- `tsconfig.web.json` - For renderer process (browser environment with React JSX)

## Common Commands

### Development

```bash
npm run dev          # Start dev server with hot reload
npm start           # Preview built app
```

### Type Checking

```bash
npm run typecheck        # Check all TypeScript
npm run typecheck:node   # Check main/preload only
npm run typecheck:web    # Check renderer only
```

### Code Quality

```bash
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

### Building

```bash
npm run build           # Type check + build for electron-vite
npm run build:unpack    # Build without packaging
npm run build:win       # Build Windows installer
npm run build:mac       # Build macOS app
npm run build:linux     # Build Linux package
```

Build configuration: `electron-builder.yml`

## Key Dependencies

### Core Framework

- **electron**: v38+ - Desktop application framework
- **electron-vite**: v4+ - Build tool optimized for Electron
- **@electron-toolkit/**: Official Electron utilities and TypeScript configs
- **electron-updater**: Auto-update functionality

### UI & Styling

- **React**: v19+ - UI framework with latest features
- **TypeScript**: v5+ - Type safety and modern JS features
- **Tailwind CSS**: v4+ - Utility-first CSS framework
- **Lucide React**: Icon library

### State & Data Management

- **Zustand**: Lightweight state management with persistence middleware
- **mysql2**: MySQL client for Node.js
- **keytar**: Secure credential storage using OS keychain

### Editor & Data Display

- **Monaco Editor**: VS Code's editor for SQL
- **@monaco-editor/react**: React wrapper for Monaco
- **TanStack Table**: v8+ - Powerful table library
- **TanStack Virtual**: Virtualization for large datasets

### Utilities

- **lodash.throttle**: Throttling utility
- **use-debounce**: React debounce hooks

## Project Structure

```
kestrel-db/
├── src/
│   ├── main/               # Main process (Node.js/Electron)
│   │   ├── index.ts        # Entry point, window management, IPC handlers
│   │   ├── database.ts     # MySQL connection management, query execution
│   │   ├── credentials.ts  # Secure credential storage via keytar
│   │   └── menu.ts         # Application menu setup
│   │
│   ├── preload/            # Preload scripts (secure bridge)
│   │   ├── index.ts        # Exposes APIs to renderer via contextBridge
│   │   └── index.d.ts      # TypeScript definitions for exposed APIs
│   │
│   └── renderer/           # Renderer process (React app)
│       └── src/
│           ├── main.tsx              # React entry point with ErrorBoundary
│           ├── App.tsx               # Main app component, routing logic
│           │
│           ├── components/           # React components
│           │   ├── data/             # Data display components
│           │   │   ├── DataGrid.tsx           # Main data grid with virtualization
│           │   │   ├── TableViewer.tsx        # Table viewer wrapper
│           │   │   ├── TableStructure.tsx     # Schema/structure view
│           │   │   └── FilterInput.tsx        # Table filtering
│           │   │
│           │   ├── layout/           # Layout components
│           │   │   ├── Layout.tsx             # App layout wrapper
│           │   │   ├── Header.tsx             # Top header with breadcrumbs
│           │   │   ├── CommandPalette.tsx     # Cmd+K command palette
│           │   │   └── Sidebar.tsx            # Left sidebar (if used)
│           │   │
│           │   ├── modals/           # Modal dialogs
│           │   │   ├── SettingsModal.tsx      # App settings (multi-tab)
│           │   │   ├── ThemeBuilderModal.tsx  # Custom theme creator
│           │   │   └── ImportPreviewModal.tsx # Settings import preview
│           │   │
│           │   ├── pages/            # Full-page components
│           │   │   └── ConnectionPage.tsx     # Initial connection screen
│           │   │
│           │   ├── sql/              # SQL editor components
│           │   │   ├── SQLDrawer.tsx          # SQL editor drawer
│           │   │   └── SQLEditor.tsx          # Monaco editor wrapper
│           │   │
│           │   ├── onboarding/       # Onboarding flow
│           │   │   └── OnboardingModal.tsx    # First-run tutorial
│           │   │
│           │   ├── error/            # Error handling
│           │   │   └── ErrorBoundary.tsx      # React error boundary
│           │   │
│           │   └── ui/               # Reusable UI components
│           │       └── Toast.tsx              # Toast notifications
│           │
│           ├── store/                # Zustand stores
│           │   ├── useAppStore.ts            # Main app state (tables, data)
│           │   ├── useConnectionsStore.ts    # Connection management
│           │   ├── useSQLStore.ts            # SQL editor state
│           │   └── useSettingsStore.ts       # User settings & themes
│           │
│           ├── theme/                # Theme system
│           │   ├── themes/                   # Built-in themes
│           │   │   ├── dark.ts
│           │   │   ├── dracula.ts
│           │   │   ├── onedark.ts
│           │   │   └── tokyonight.ts
│           │   ├── types.ts                  # Theme type definitions
│           │   ├── ThemeProvider.tsx         # Theme context provider
│           │   └── index.ts                  # Theme exports
│           │
│           ├── types/                # TypeScript types
│           │   └── api.ts                    # IPC API types
│           │
│           └── utils/                # Utility functions
│               └── platform.ts               # Platform detection & shortcuts
│
├── resources/              # Static resources (icons, images)
├── build/                  # Build configuration
├── out/                    # Build output
└── dist/                   # Distribution packages

```

## State Management

### Store Architecture

The app uses Zustand for state management with four main stores:

1. **useAppStore** - Core application state
   - Active table, database, and server
   - Table data, loading states
   - View mode (data/structure)
   - Command palette state
   - Toast notifications

2. **useConnectionsStore** - Connection management
   - List of saved connections
   - Connection CRUD operations
   - Persisted to localStorage

3. **useSQLStore** - SQL editor state
   - SQL drawer open/closed state
   - Current SQL query
   - Query history
   - Saved queries
   - Last execution results
   - Persisted to localStorage

4. **useSettingsStore** - User settings
   - Active theme and custom themes
   - Appearance settings (font, scale, animations)
   - Performance settings (chunk size, timeout)
   - Display preferences (date format, colors)
   - Onboarding completion status
   - Persisted to localStorage

### Store Patterns

```typescript
// Use granular selectors to prevent unnecessary re-renders
const activeTable = useAppStore((state) => state.activeTable)
const selectTable = useAppStore((state) => state.selectTable)

// NOT like this (causes re-renders on any state change):
const store = useAppStore()
```

## IPC Communication

### Pattern

```typescript
// Main Process (src/main/index.ts)
ipcMain.handle('connection:connect', async (_, config) => {
  // Handle connection logic
  return { success: true, data: result }
})

// Preload (src/preload/index.ts)
const api = {
  connection: {
    connect: (config) => ipcRenderer.invoke('connection:connect', config)
  }
}
contextBridge.exposeInMainWorld('api', api)

// Renderer (React components)
const result = await window.api.connection.connect(config)
```

### Available IPC Channels

- `connection:connect` - Connect to MySQL server
- `connection:disconnect` - Disconnect from server
- `database:getTables` - Get tables in database
- `database:getTableData` - Fetch table data (with pagination)
- `database:getStructure` - Get table structure
- `database:executeQuery` - Execute custom SQL query
- `credentials:save` - Save credentials securely
- `credentials:get` - Retrieve credentials
- `export:csv` - Export data to CSV
- `export:json` - Export data to JSON
- `update:check` - Check for app updates
- `dialog:save` - Show save file dialog

## Coding Standards

### TypeScript

- **Strict mode enabled** - All strict TypeScript checks
- **No `any` types** - Use `unknown` or proper types
- **Explicit return types** - For functions and components
- **Interface for object shapes** - Use `interface` for objects, `type` for unions
- **Named exports** - Avoid default exports except for main components

### React Components

```typescript
// Good: Functional component with explicit types
interface DataGridProps {
  data: any[]
  tableName: string
  isLoading?: boolean
}

export function DataGrid({ data, tableName, isLoading }: DataGridProps): React.JSX.Element {
  // Component logic
}

// Use hooks for side effects
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  }
}, [dependencies])
```

### Performance Best Practices

1. **Virtualization** - Use TanStack Virtual for large lists/tables
2. **Memoization** - Use `useMemo` for expensive calculations
3. **Callback stability** - Use `useCallback` for event handlers passed to children
4. **Granular selectors** - Select only needed state from stores
5. **Throttling/Debouncing** - For expensive operations (search, scroll)

### Component Patterns

```typescript
// Custom hooks for reusable logic
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === key) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}

// Use in components
function MyComponent() {
  useKeyboardShortcut('k', () => openCommandPalette())
}
```

## Keyboard Shortcuts

The app is keyboard-first. Important shortcuts are defined in `App.tsx`:

- `Cmd/Ctrl + K` - Toggle command palette
- `Cmd/Ctrl + /` - Open SQL editor
- `Cmd/Ctrl + ,` - Open settings
- `Cmd/Ctrl + R` - Refresh current table
- `Cmd/Ctrl + T` - Toggle data/structure view
- `Cmd/Ctrl + E` - Export table
- `Escape` - Close modals/drawers
- `h/j/k/l` - Vim-style cell navigation in data grid

### Cross-Platform Shortcut Display

Use the platform utility to display the correct modifier key for the user's OS:

```typescript
import { getModifierKey, formatShortcut } from '../utils/platform'

// Get the modifier key name (e.g., "Cmd" on macOS, "Ctrl" on Windows/Linux)
const modKey = getModifierKey()

// Display in UI
<kbd>{modKey}+K</kbd>  // Shows "Cmd+K" on macOS, "Ctrl+K" on Windows/Linux

// Or use the helper function
const shortcut = formatShortcut('K')  // Returns "Cmd+K" or "Ctrl+K"
```

**Important**: All keyboard event handlers already use `(e.metaKey || e.ctrlKey)` so shortcuts work cross-platform. The platform utility is only for **displaying** the correct keys to users.

### When adding new shortcuts:

1. Use `(e.metaKey || e.ctrlKey)` in event handlers for cross-platform support
2. Use `getModifierKey()` to display the correct key in UI
3. Check for conflicts with existing shortcuts
4. Test on both macOS and Windows/Linux
5. Document in README.md
6. Add to settings modal shortcuts tab

## Theme System

### Theme Structure

Themes are defined in `src/renderer/src/theme/types.ts`:

```typescript
interface ThemeColors {
  background: { primary, secondary, tertiary, elevated }
  text: { primary, secondary, tertiary, inverse }
  border: { default, subtle, focus }
  accent: { primary, hover, active, subtle }
  semantic: { success, error, warning, info + subtle variants }
  dataTypes: { uuid, hex, date, json, boolean }
  special: { database, overlay, scrollbar }
}
```

### Using Theme Colors

Theme colors are applied via Tailwind CSS using CSS custom properties defined in `ThemeProvider.tsx`:

```tsx
// In components, use Tailwind classes that map to theme variables
<div className="bg-secondary text-primary border-default">
  <button className="bg-accent hover:bg-accent-hover">Click</button>
</div>
```

### Custom Themes

Users can create custom themes via Settings > Appearance > Theme Builder. Custom themes are stored in `useSettingsStore` and persisted to localStorage.

## Database Operations

### Connection Management

Connections are managed in `src/main/database.ts`. Each window has its own connection pool to avoid conflicts.

### Query Execution

Queries are paginated by default:

- **Default chunk size**: 5000 rows (configurable in settings)
- **Dynamic sizing**: Automatically adjusts based on data complexity
- **Query timeout**: Configurable (default: no timeout)

### Security

- Credentials stored securely using OS keychain (via keytar)
- No plaintext passwords in memory longer than necessary
- SQL injection prevention via parameterized queries (where applicable)

## Error Handling

### React Error Boundary

`ErrorBoundary.tsx` catches all React errors and displays a friendly UI with:

- Error message
- Reload button
- Copy error details
- Technical details (collapsible)

### IPC Error Handling

All IPC handlers return `{ success: boolean, data?: any, error?: string }`:

```typescript
try {
  const result = await window.api.database.getTables()
  if (!result.success) {
    showToast(result.error || 'Failed to load tables', 'error')
    return
  }
  // Use result.data
} catch (error) {
  showToast('Unexpected error occurred', 'error')
  console.error(error)
}
```

## Important Disclaimers

This is open-source software provided "as is" without warranty. Key points:

- Always backup data before operations
- Test on non-production databases first
- No guarantee of uptime or data safety
- Use at your own risk
- See LICENSE for full legal text

Disclaimers are included in:

- README.md (installation section)
- Settings modal About tab
- LICENSE file

## Development Guidelines

### Before Committing

1. **Type check**: `npm run typecheck`
2. **Lint**: `npm run lint`
3. **Format**: `npm run format`
4. **Test manually**: Run app with `npm run dev`

### Adding New Features

1. Update relevant store if state is needed
2. Create/update components
3. Add IPC handlers if main process interaction needed
4. Update types in `src/preload/index.d.ts`
5. Test keyboard shortcuts don't conflict
6. Update documentation (README, CLAUDE.md)

### Common Pitfalls

1. **Don't use `any` types** - Always properly type your data
2. **Don't default export components** - Use named exports for better refactoring
3. **Don't forget cleanup** - Return cleanup functions from `useEffect`
4. **Don't skip TypeScript errors** - Fix them, don't suppress them
5. **Don't commit console.log** - Use proper error handling instead (except in main process for logging)

## Testing

Currently, the project does not have automated tests. Manual testing is required:

1. Test all keyboard shortcuts
2. Test with different themes
3. Test with large datasets (10k+ rows)
4. Test connection failure scenarios
5. Test on multiple platforms if possible

## Future Considerations

Potential features for future versions:

- PostgreSQL support
- Data editing (INSERT, UPDATE, DELETE)
- Advanced filtering with WHERE clause builder
- Query result comparison
- Database migrations
- SSH tunneling
- SSL/TLS connections
- Automated testing suite

## Questions?

For questions about the codebase, refer to:

- This CLAUDE.md file
- README.md for user-facing documentation
- CONTRIBUTING.md for contribution guidelines
- Inline code comments for specific implementation details
