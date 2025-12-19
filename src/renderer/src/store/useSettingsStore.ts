/**
 * Settings Store
 *
 * Manages user settings and theme preferences with localStorage persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeSettings, Theme } from '../theme/types'
import { DEFAULT_THEME_SETTINGS } from '../theme/types'
import { getTheme } from '../theme/themes'

export interface ExportedSettings {
  version: string
  exportDate: string
  settings: ThemeSettings
}

export interface ExportedTheme {
  type: 'kestrel-theme'
  version: string
  exportDate: string
  theme: Theme
}

export interface ImportValidationResult {
  isValid: boolean
  settings?: Partial<ThemeSettings>
  warnings: string[]
  errors: string[]
}

export interface ThemeImportResult {
  isValid: boolean
  theme?: Theme
  errors: string[]
}

interface SettingsStore extends ThemeSettings {
  // Actions
  setTheme: (themeId: string) => void
  setHighContrast: (enabled: boolean) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setUiScale: (scale: number) => void
  setReduceAnimations: (enabled: boolean) => void
  setDefaultChunkSize: (size: number) => void
  setOverrideDynamicSizing: (override: boolean) => void
  setQueryTimeout: (seconds: number) => void
  setShowDataTypeColors: (show: boolean) => void
  setDateFormat: (format: 'iso' | 'local' | 'relative') => void
  setNumberFormat: (format: 'raw' | 'formatted') => void
  setOnboardingCompleted: () => void
  resetSettings: () => void

  // Custom Theme Management
  addCustomTheme: (theme: Theme) => void
  updateCustomTheme: (themeId: string, theme: Theme) => void
  removeCustomTheme: (themeId: string) => void
  getCustomTheme: (themeId: string) => Theme | undefined

  // Settings Import/Export
  exportSettings: () => ExportedSettings
  validateImportedSettings: (jsonString: string) => ImportValidationResult
  applyImportedSettings: (settings: Partial<ThemeSettings>) => void

  // Theme Import/Export
  exportTheme: (themeId: string) => ExportedTheme | null
  importTheme: (jsonString: string) => ThemeImportResult

  // Computed
  getCurrentTheme: () => Theme
  getAllThemes: () => Theme[]
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state from defaults
      ...DEFAULT_THEME_SETTINGS,

      // Actions
      setTheme: (themeId: string) => set({ activeTheme: themeId }),

      setHighContrast: (enabled: boolean) => set({ highContrast: enabled }),

      setFontSize: (size: number) =>
        set({
          fontSize: Math.max(12, Math.min(16, size))
        }),

      setFontFamily: (family: string) => set({ fontFamily: family }),

      setUiScale: (scale: number) =>
        set({
          uiScale: Math.max(90, Math.min(120, scale))
        }),

      setReduceAnimations: (enabled: boolean) => set({ reduceAnimations: enabled }),

      setDefaultChunkSize: (size: number) =>
        set({
          defaultChunkSize: Math.max(100, Math.min(10000, size))
        }),

      setOverrideDynamicSizing: (override: boolean) => set({ overrideDynamicSizing: override }),

      setQueryTimeout: (seconds: number) =>
        set({
          queryTimeout: Math.max(0, seconds)
        }),

      setShowDataTypeColors: (show: boolean) => set({ showDataTypeColors: show }),

      setDateFormat: (format: 'iso' | 'local' | 'relative') => set({ dateFormat: format }),

      setNumberFormat: (format: 'raw' | 'formatted') => set({ numberFormat: format }),

      setOnboardingCompleted: () => set({ hasCompletedOnboarding: true }),

      resetSettings: () => set({ ...DEFAULT_THEME_SETTINGS }),

      // Custom Theme Management
      addCustomTheme: (theme: Theme) => {
        const state = get()
        // Check if theme with this ID already exists
        const exists = state.customThemes.some((t) => t.id === theme.id)
        if (exists) {
          // Update existing theme
          set({
            customThemes: state.customThemes.map((t) => (t.id === theme.id ? theme : t)),
            activeTheme: theme.id
          })
        } else {
          // Add new theme
          set({
            customThemes: [...state.customThemes, theme],
            activeTheme: theme.id
          })
        }
      },

      updateCustomTheme: (themeId: string, theme: Theme) => {
        const state = get()
        set({
          customThemes: state.customThemes.map((t) => (t.id === themeId ? theme : t))
        })
      },

      removeCustomTheme: (themeId: string) => {
        const state = get()
        set({
          customThemes: state.customThemes.filter((t) => t.id !== themeId),
          // If removing active theme, switch to default
          activeTheme: state.activeTheme === themeId ? 'dark' : state.activeTheme
        })
      },

      getCustomTheme: (themeId: string) => {
        const state = get()
        return state.customThemes.find((t) => t.id === themeId)
      },

      // Settings Import/Export
      exportSettings: (): ExportedSettings => {
        const state = get()
        return {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          settings: {
            activeTheme: state.activeTheme,
            customThemes: state.customThemes,
            highContrast: state.highContrast,
            fontSize: state.fontSize,
            fontFamily: state.fontFamily,
            uiScale: state.uiScale,
            reduceAnimations: state.reduceAnimations,
            defaultChunkSize: state.defaultChunkSize,
            overrideDynamicSizing: state.overrideDynamicSizing,
            queryTimeout: state.queryTimeout,
            showDataTypeColors: state.showDataTypeColors,
            dateFormat: state.dateFormat,
            numberFormat: state.numberFormat,
            hasCompletedOnboarding: state.hasCompletedOnboarding
          }
        }
      },

      validateImportedSettings: (jsonString: string): ImportValidationResult => {
        const warnings: string[] = []
        const errors: string[] = []

        try {
          const parsed = JSON.parse(jsonString)

          // Check if it's our exported format
          if (!parsed.settings) {
            errors.push('Invalid format: missing "settings" field')
            return { isValid: false, warnings, errors }
          }

          const imported = parsed.settings
          const validSettings: Partial<ThemeSettings> = {}

          // Validate each field
          if ('activeTheme' in imported && typeof imported.activeTheme === 'string') {
            validSettings.activeTheme = imported.activeTheme
          } else if ('activeTheme' in imported) {
            warnings.push('Invalid activeTheme value (skipped)')
          }

          if ('customThemes' in imported) {
            // Validate custom themes array
            if (Array.isArray(imported.customThemes)) {
              const validThemes = imported.customThemes.filter(
                (theme: unknown): theme is { id: string; name: string; colors: unknown } =>
                  theme !== null &&
                  typeof theme === 'object' &&
                  'id' in theme &&
                  'name' in theme &&
                  'colors' in theme
              )
              if (validThemes.length > 0) {
                validSettings.customThemes = validThemes as Theme[]
              }
              if (validThemes.length < imported.customThemes.length) {
                warnings.push(
                  `${imported.customThemes.length - validThemes.length} invalid custom theme(s) skipped`
                )
              }
            } else if (imported.customThemes !== undefined) {
              warnings.push('Invalid customThemes value (skipped)')
            }
          }

          if ('highContrast' in imported && typeof imported.highContrast === 'boolean') {
            validSettings.highContrast = imported.highContrast
          } else if ('highContrast' in imported) {
            warnings.push('Invalid highContrast value (skipped)')
          }

          if ('fontSize' in imported && typeof imported.fontSize === 'number') {
            if (imported.fontSize >= 12 && imported.fontSize <= 16) {
              validSettings.fontSize = imported.fontSize
            } else {
              warnings.push('fontSize out of range (12-16), using default')
            }
          } else if ('fontSize' in imported) {
            warnings.push('Invalid fontSize value (skipped)')
          }

          if ('fontFamily' in imported && typeof imported.fontFamily === 'string') {
            validSettings.fontFamily = imported.fontFamily
          } else if ('fontFamily' in imported) {
            warnings.push('Invalid fontFamily value (skipped)')
          }

          if ('uiScale' in imported && typeof imported.uiScale === 'number') {
            if (imported.uiScale >= 90 && imported.uiScale <= 120) {
              validSettings.uiScale = imported.uiScale
            } else {
              warnings.push('uiScale out of range (90-120), using default')
            }
          } else if ('uiScale' in imported) {
            warnings.push('Invalid uiScale value (skipped)')
          }

          if ('reduceAnimations' in imported && typeof imported.reduceAnimations === 'boolean') {
            validSettings.reduceAnimations = imported.reduceAnimations
          } else if ('reduceAnimations' in imported) {
            warnings.push('Invalid reduceAnimations value (skipped)')
          }

          if ('defaultChunkSize' in imported && typeof imported.defaultChunkSize === 'number') {
            if (imported.defaultChunkSize >= 100 && imported.defaultChunkSize <= 10000) {
              validSettings.defaultChunkSize = imported.defaultChunkSize
            } else {
              warnings.push('defaultChunkSize out of range (100-10000), using default')
            }
          } else if ('defaultChunkSize' in imported) {
            warnings.push('Invalid defaultChunkSize value (skipped)')
          }

          if (
            'overrideDynamicSizing' in imported &&
            typeof imported.overrideDynamicSizing === 'boolean'
          ) {
            validSettings.overrideDynamicSizing = imported.overrideDynamicSizing
          } else if ('overrideDynamicSizing' in imported) {
            warnings.push('Invalid overrideDynamicSizing value (skipped)')
          }

          if ('queryTimeout' in imported && typeof imported.queryTimeout === 'number') {
            if (imported.queryTimeout >= 0) {
              validSettings.queryTimeout = imported.queryTimeout
            } else {
              warnings.push('queryTimeout must be >= 0, using default')
            }
          } else if ('queryTimeout' in imported) {
            warnings.push('Invalid queryTimeout value (skipped)')
          }

          if (
            'showDataTypeColors' in imported &&
            typeof imported.showDataTypeColors === 'boolean'
          ) {
            validSettings.showDataTypeColors = imported.showDataTypeColors
          } else if ('showDataTypeColors' in imported) {
            warnings.push('Invalid showDataTypeColors value (skipped)')
          }

          if ('dateFormat' in imported) {
            if (['iso', 'local', 'relative'].includes(imported.dateFormat)) {
              validSettings.dateFormat = imported.dateFormat as 'iso' | 'local' | 'relative'
            } else {
              warnings.push('Invalid dateFormat value (skipped)')
            }
          }

          if ('numberFormat' in imported) {
            if (['raw', 'formatted'].includes(imported.numberFormat)) {
              validSettings.numberFormat = imported.numberFormat as 'raw' | 'formatted'
            } else {
              warnings.push('Invalid numberFormat value (skipped)')
            }
          }

          // Check for unknown fields
          const knownFields = [
            'activeTheme',
            'customThemes',
            'highContrast',
            'fontSize',
            'fontFamily',
            'uiScale',
            'reduceAnimations',
            'defaultChunkSize',
            'overrideDynamicSizing',
            'queryTimeout',
            'showDataTypeColors',
            'dateFormat',
            'numberFormat'
          ]
          for (const key in imported) {
            if (!knownFields.includes(key)) {
              warnings.push(`Unknown field "${key}" (skipped)`)
            }
          }

          return {
            isValid: Object.keys(validSettings).length > 0,
            settings: validSettings,
            warnings,
            errors
          }
        } catch (error) {
          errors.push(
            `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
          )
          return { isValid: false, warnings, errors }
        }
      },

      applyImportedSettings: (settings: Partial<ThemeSettings>) => {
        set(settings)
      },

      // Theme Import/Export
      exportTheme: (themeId: string): ExportedTheme | null => {
        const state = get()
        const theme = state.customThemes.find((t) => t.id === themeId)
        if (!theme) return null

        // Omit the id field so each import generates a new unique ID
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...themeWithoutId } = theme

        return {
          type: 'kestrel-theme',
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          theme: themeWithoutId as Theme
        }
      },

      importTheme: (jsonString: string): ThemeImportResult => {
        const errors: string[] = []

        try {
          const parsed = JSON.parse(jsonString)

          // Check if it's a theme file
          if (parsed.type !== 'kestrel-theme') {
            errors.push('Invalid file type: not a Kestrel theme file')
            return { isValid: false, errors }
          }

          // Validate theme structure
          if (!parsed.theme) {
            errors.push('Invalid format: missing "theme" field')
            return { isValid: false, errors }
          }

          const theme = parsed.theme

          // Validate required fields (id is NOT required - we'll generate it)
          if (!theme.name || typeof theme.name !== 'string') {
            errors.push('Invalid theme: missing or invalid "name"')
          }
          if (!theme.colors || typeof theme.colors !== 'object') {
            errors.push('Invalid theme: missing or invalid "colors"')
          }

          if (errors.length > 0) {
            return { isValid: false, errors }
          }

          // Generate a new unique ID for the imported theme
          const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          return {
            isValid: true,
            theme: {
              ...theme,
              id: uniqueId,
              isDark: theme.isDark ?? true
            } as Theme,
            errors: []
          }
        } catch (error) {
          errors.push(
            `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`
          )
          return { isValid: false, errors }
        }
      },

      // Computed
      getCurrentTheme: (): Theme => {
        const state = get()
        // Check if active theme is a custom theme
        const customTheme = state.customThemes.find((t) => t.id === state.activeTheme)
        if (customTheme) {
          return customTheme
        }
        // Otherwise get built-in theme
        return getTheme(state.activeTheme)
      },

      getAllThemes: (): Theme[] => {
        const state = get()
        return [...state.customThemes]
      }
    }),
    {
      name: 'kestrel-settings', // localStorage key
      version: 1 // Version for migrations
    }
  )
)
