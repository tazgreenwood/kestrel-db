/**
 * CSS Variable Injection System
 *
 * Converts theme colors to CSS variables and injects them into the document
 */

import type { Theme } from './types'

/**
 * Convert theme colors to CSS variable object
 */
export function themeToCssVariables(theme: Theme): Record<string, string> {
  const { colors } = theme

  return {
    // Background
    '--bg-primary': colors.background.primary,
    '--bg-secondary': colors.background.secondary,
    '--bg-tertiary': colors.background.tertiary,
    '--bg-elevated': colors.background.elevated,

    // Text
    '--text-primary': colors.text.primary,
    '--text-secondary': colors.text.secondary,
    '--text-tertiary': colors.text.tertiary,
    '--text-inverse': colors.text.inverse,

    // Borders
    '--border-default': colors.border.default,
    '--border-subtle': colors.border.subtle,
    '--border-focus': colors.border.focus,

    // Accent
    '--accent-primary': colors.accent.primary,
    '--accent-hover': colors.accent.hover,
    '--accent-active': colors.accent.active,
    '--accent-subtle': colors.accent.subtle,

    // Semantic
    '--success': colors.semantic.success,
    '--success-subtle': colors.semantic.successSubtle,
    '--error': colors.semantic.error,
    '--error-subtle': colors.semantic.errorSubtle,
    '--warning': colors.semantic.warning,
    '--warning-subtle': colors.semantic.warningSubtle,
    '--info': colors.semantic.info,
    '--info-subtle': colors.semantic.infoSubtle,

    // Data Types
    '--data-uuid': colors.dataTypes.uuid,
    '--data-hex': colors.dataTypes.hex,
    '--data-date': colors.dataTypes.date,
    '--data-json': colors.dataTypes.json,
    '--data-boolean-true': colors.dataTypes.boolean.true,
    '--data-boolean-false': colors.dataTypes.boolean.false,

    // Special
    '--special-database': colors.special.database,
    '--special-overlay': colors.special.overlay,
    '--scrollbar': colors.special.scrollbar,
    '--scrollbar-hover': colors.special.scrollbarHover
  }
}

/**
 * Inject CSS variables into document root
 */
export function injectCssVariables(theme: Theme): void {
  const variables = themeToCssVariables(theme)
  const root = document.documentElement

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // Add data attribute for theme-specific styles
  root.setAttribute('data-theme', theme.id)
  root.setAttribute('data-theme-dark', theme.isDark ? 'true' : 'false')
}

/**
 * Apply font settings to document
 */
export function applyFontSettings(fontSize: number, fontFamily: string, uiScale: number): void {
  const root = document.documentElement

  // Font size for data cells (monospace)
  root.style.setProperty('--font-size-data', `${fontSize}px`)

  // Font family for data cells
  root.style.setProperty('--font-family-data', fontFamily)

  // UI scale (affects entire interface)
  root.style.setProperty('--ui-scale', `${uiScale / 100}`)
}

/**
 * Apply animation settings
 */
export function applyAnimationSettings(reduceAnimations: boolean): void {
  const root = document.documentElement

  if (reduceAnimations) {
    root.style.setProperty('--transition-duration', '0s')
    root.classList.add('reduce-motion')
  } else {
    root.style.setProperty('--transition-duration', '150ms')
    root.classList.remove('reduce-motion')
  }
}

/**
 * Apply high contrast mode
 */
export function applyHighContrastSettings(highContrast: boolean): void {
  const root = document.documentElement

  if (highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }
}

/**
 * Apply all theme and appearance settings
 */
export function applyThemeSettings(
  theme: Theme,
  fontSize: number,
  fontFamily: string,
  uiScale: number,
  reduceAnimations: boolean,
  highContrast: boolean
): void {
  injectCssVariables(theme)
  applyFontSettings(fontSize, fontFamily, uiScale)
  applyAnimationSettings(reduceAnimations)
  applyHighContrastSettings(highContrast)
}
