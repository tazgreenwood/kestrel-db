/**
 * Platform Utilities
 *
 * Helpers for detecting platform and displaying platform-specific UI
 */

/**
 * Detect if we're running on macOS
 */
export function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

/**
 * Get the modifier key symbol for the current platform
 * Returns '⌘' for macOS, 'Ctrl' for Windows/Linux
 */
export function getModifierSymbol(): string {
  return isMac() ? '⌘' : 'Ctrl'
}

/**
 * Get the modifier key name for the current platform
 * Returns 'Cmd' for macOS, 'Ctrl' for Windows/Linux
 */
export function getModifierKey(): string {
  return isMac() ? 'Cmd' : 'Ctrl'
}

/**
 * Format a keyboard shortcut for the current platform
 * @param key - The key (e.g., 'K', 'R', 'Enter')
 * @param useSymbol - Whether to use symbols (⌘) or text (Cmd)
 * @returns Formatted shortcut string (e.g., 'Cmd+K' or '⌘K')
 */
export function formatShortcut(key: string, useSymbol = false): string {
  const modifier = useSymbol ? getModifierSymbol() : getModifierKey()
  return `${modifier}+${key}`
}

/**
 * Format multiple keys in a shortcut
 * @param keys - Array of keys (e.g., ['Shift', 'K'])
 * @param useSymbol - Whether to use symbols
 * @returns Formatted shortcut string
 */
export function formatComplexShortcut(keys: string[], useSymbol = false): string {
  const modifier = useSymbol ? getModifierSymbol() : getModifierKey()
  return [modifier, ...keys].join('+')
}
