/**
 * Theme Type Definitions
 *
 * Defines the structure for themes in Kestrel DB
 */

export interface ThemeColors {
  // Background colors
  background: {
    primary: string // Main app background
    secondary: string // Panels, cards, headers
    tertiary: string // Hover states, elevated surfaces
    elevated: string // Modals, dropdowns
  }

  // Text colors
  text: {
    primary: string // Main text
    secondary: string // Muted text, labels
    tertiary: string // Disabled, placeholder
    inverse: string // Text on colored backgrounds
  }

  // Border colors
  border: {
    default: string // Standard borders
    subtle: string // Faint dividers
    focus: string // Focus rings
  }

  // Interactive/Accent colors
  accent: {
    primary: string // Main interactive color
    hover: string // Hover state
    active: string // Active/selected state
    subtle: string // Subtle backgrounds (with opacity)
  }

  // Semantic colors
  semantic: {
    success: string // Success states, checkmarks
    successSubtle: string
    error: string // Errors, destructive actions
    errorSubtle: string
    warning: string // Warnings, caution
    warningSubtle: string
    info: string // Info, neutral alerts
    infoSubtle: string
  }

  // Data type visualization colors
  dataTypes: {
    uuid: string // UUID highlighting
    hex: string // Hex/binary data
    date: string // Dates and timestamps
    json: string // JSON objects
    boolean: {
      true: string // True/yes values
      false: string // False/no values
    }
  }

  // Special purpose colors
  special: {
    database: string // Database indicators
    overlay: string // Modal overlays
    scrollbar: string // Scrollbar thumb
    scrollbarHover: string
  }
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColors

  // Metadata
  author?: string
  isDark: boolean
}

export interface ThemeSettings {
  // Active theme
  activeTheme: string
  customThemes: Theme[]

  // Appearance
  highContrast: boolean
  fontSize: number // 12-16px
  fontFamily: string // mono font for data
  uiScale: number // 90-120%
  reduceAnimations: boolean

  // Data & Performance
  defaultChunkSize: number
  overrideDynamicSizing: boolean
  queryTimeout: number // seconds, 0 = no limit

  // Display preferences
  showDataTypeColors: boolean
  dateFormat: 'iso' | 'local' | 'relative'
  numberFormat: 'raw' | 'formatted'

  // Onboarding
  hasCompletedOnboarding: boolean
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  activeTheme: 'dark-slate',
  customThemes: [],
  highContrast: false,
  fontSize: 13,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace", // Recommended font with system fallback
  uiScale: 100,
  reduceAnimations: false,
  defaultChunkSize: 5000,
  overrideDynamicSizing: false,
  queryTimeout: 0,
  showDataTypeColors: true,
  dateFormat: 'iso',
  numberFormat: 'raw',
  hasCompletedOnboarding: false
}
