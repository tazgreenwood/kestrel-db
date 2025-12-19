/**
 * Theme Provider Component
 *
 * Applies theme settings to the document and watches for changes
 */

import React, { useEffect, type ReactNode } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { applyThemeSettings } from './cssVariables'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const {
    activeTheme,
    customThemes,
    getCurrentTheme,
    fontSize,
    fontFamily,
    uiScale,
    reduceAnimations,
    highContrast
  } = useSettingsStore()

  // Apply theme on mount and when settings change
  useEffect(() => {
    const theme = getCurrentTheme()
    applyThemeSettings(theme, fontSize, fontFamily, uiScale, reduceAnimations, highContrast)
  }, [
    activeTheme,
    customThemes,
    getCurrentTheme,
    fontSize,
    fontFamily,
    uiScale,
    reduceAnimations,
    highContrast
  ])

  return <>{children}</>
}
