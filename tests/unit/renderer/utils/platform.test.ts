import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isMac,
  getModifierSymbol,
  getModifierKey,
  formatShortcut,
  formatComplexShortcut
} from '../../../../src/renderer/src/utils/platform'

describe('platform utilities', () => {
  let originalPlatform: string

  beforeEach(() => {
    // Store original platform
    originalPlatform = navigator.platform
  })

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true
    })
  })

  /**
   * Helper to mock navigator.platform
   */
  function mockPlatform(platform: string): void {
    Object.defineProperty(navigator, 'platform', {
      value: platform,
      writable: true,
      configurable: true
    })
  }

  describe('isMac', () => {
    it('should return true for macOS platforms', () => {
      mockPlatform('MacIntel')
      expect(isMac()).toBe(true)
    })

    it('should return true for MacPPC', () => {
      mockPlatform('MacPPC')
      expect(isMac()).toBe(true)
    })

    it('should return true for Mac68K', () => {
      mockPlatform('Mac68K')
      expect(isMac()).toBe(true)
    })

    it('should return true for lowercase mac', () => {
      mockPlatform('macIntel')
      expect(isMac()).toBe(true)
    })

    it('should return false for Windows', () => {
      mockPlatform('Win32')
      expect(isMac()).toBe(false)
    })

    it('should return false for Windows 64-bit', () => {
      mockPlatform('Win64')
      expect(isMac()).toBe(false)
    })

    it('should return false for Linux x86_64', () => {
      mockPlatform('Linux x86_64')
      expect(isMac()).toBe(false)
    })

    it('should return false for Linux i686', () => {
      mockPlatform('Linux i686')
      expect(isMac()).toBe(false)
    })

    it('should return false for unknown platforms', () => {
      mockPlatform('Unknown')
      expect(isMac()).toBe(false)
    })
  })

  describe('getModifierSymbol', () => {
    it('should return ⌘ symbol on macOS', () => {
      mockPlatform('MacIntel')
      expect(getModifierSymbol()).toBe('⌘')
    })

    it('should return Ctrl on Windows', () => {
      mockPlatform('Win32')
      expect(getModifierSymbol()).toBe('Ctrl')
    })

    it('should return Ctrl on Linux', () => {
      mockPlatform('Linux x86_64')
      expect(getModifierSymbol()).toBe('Ctrl')
    })
  })

  describe('getModifierKey', () => {
    it('should return Cmd on macOS', () => {
      mockPlatform('MacIntel')
      expect(getModifierKey()).toBe('Cmd')
    })

    it('should return Ctrl on Windows', () => {
      mockPlatform('Win32')
      expect(getModifierKey()).toBe('Ctrl')
    })

    it('should return Ctrl on Linux', () => {
      mockPlatform('Linux x86_64')
      expect(getModifierKey()).toBe('Ctrl')
    })
  })

  describe('formatShortcut', () => {
    describe('with text format (useSymbol=false)', () => {
      it('should format Cmd+K on macOS', () => {
        mockPlatform('MacIntel')
        expect(formatShortcut('K')).toBe('Cmd+K')
      })

      it('should format Ctrl+K on Windows', () => {
        mockPlatform('Win32')
        expect(formatShortcut('K')).toBe('Ctrl+K')
      })

      it('should format Ctrl+K on Linux', () => {
        mockPlatform('Linux x86_64')
        expect(formatShortcut('K')).toBe('Ctrl+K')
      })

      it('should format different keys correctly', () => {
        mockPlatform('MacIntel')
        expect(formatShortcut('R')).toBe('Cmd+R')
        expect(formatShortcut('T')).toBe('Cmd+T')
        expect(formatShortcut('/')).toBe('Cmd+/')
        expect(formatShortcut(',')).toBe('Cmd+,')
        expect(formatShortcut('Enter')).toBe('Cmd+Enter')
      })

      it('should use default useSymbol=false', () => {
        mockPlatform('MacIntel')
        expect(formatShortcut('K')).toBe('Cmd+K')
        expect(formatShortcut('K', false)).toBe('Cmd+K')
      })
    })

    describe('with symbol format (useSymbol=true)', () => {
      it('should format ⌘+K on macOS', () => {
        mockPlatform('MacIntel')
        expect(formatShortcut('K', true)).toBe('⌘+K')
      })

      it('should format Ctrl+K on Windows (no symbol)', () => {
        mockPlatform('Win32')
        expect(formatShortcut('K', true)).toBe('Ctrl+K')
      })

      it('should format Ctrl+K on Linux (no symbol)', () => {
        mockPlatform('Linux x86_64')
        expect(formatShortcut('K', true)).toBe('Ctrl+K')
      })

      it('should format different keys with symbol', () => {
        mockPlatform('MacIntel')
        expect(formatShortcut('R', true)).toBe('⌘+R')
        expect(formatShortcut('/', true)).toBe('⌘+/')
        expect(formatShortcut('Enter', true)).toBe('⌘+Enter')
      })
    })
  })

  describe('formatComplexShortcut', () => {
    describe('with text format (useSymbol=false)', () => {
      it('should format Cmd+Shift+K on macOS', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut(['Shift', 'K'])).toBe('Cmd+Shift+K')
      })

      it('should format Ctrl+Shift+K on Windows', () => {
        mockPlatform('Win32')
        expect(formatComplexShortcut(['Shift', 'K'])).toBe('Ctrl+Shift+K')
      })

      it('should format Ctrl+Shift+K on Linux', () => {
        mockPlatform('Linux x86_64')
        expect(formatComplexShortcut(['Shift', 'K'])).toBe('Ctrl+Shift+K')
      })

      it('should handle single additional key', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut(['K'])).toBe('Cmd+K')
      })

      it('should handle multiple additional keys', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut(['Shift', 'Alt', 'K'])).toBe('Cmd+Shift+Alt+K')
        expect(formatComplexShortcut(['Ctrl', 'Shift', 'T'])).toBe('Cmd+Ctrl+Shift+T')
      })

      it('should handle empty array', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut([])).toBe('Cmd')
      })

      it('should use default useSymbol=false', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut(['Shift', 'K'])).toBe('Cmd+Shift+K')
        expect(formatComplexShortcut(['Shift', 'K'], false)).toBe('Cmd+Shift+K')
      })
    })

    describe('with symbol format (useSymbol=true)', () => {
      it('should format ⌘+Shift+K on macOS', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut(['Shift', 'K'], true)).toBe('⌘+Shift+K')
      })

      it('should format Ctrl+Shift+K on Windows (no symbol)', () => {
        mockPlatform('Win32')
        expect(formatComplexShortcut(['Shift', 'K'], true)).toBe('Ctrl+Shift+K')
      })

      it('should format Ctrl+Shift+K on Linux (no symbol)', () => {
        mockPlatform('Linux x86_64')
        expect(formatComplexShortcut(['Shift', 'K'], true)).toBe('Ctrl+Shift+K')
      })

      it('should handle multiple keys with symbol', () => {
        mockPlatform('MacIntel')
        expect(formatComplexShortcut(['Shift', 'Alt', 'K'], true)).toBe('⌘+Shift+Alt+K')
      })
    })
  })

  describe('Cross-platform consistency', () => {
    it('should maintain consistent format across platforms', () => {
      // macOS
      mockPlatform('MacIntel')
      const macShortcut = formatShortcut('K')
      const macComplex = formatComplexShortcut(['Shift', 'K'])

      // Windows
      mockPlatform('Win32')
      const winShortcut = formatShortcut('K')
      const winComplex = formatComplexShortcut(['Shift', 'K'])

      // Linux
      mockPlatform('Linux x86_64')
      const linuxShortcut = formatShortcut('K')
      const linuxComplex = formatComplexShortcut(['Shift', 'K'])

      // All should use same format (modifier+key)
      expect(macShortcut).toMatch(/^(Cmd|Ctrl)\+K$/)
      expect(winShortcut).toMatch(/^(Cmd|Ctrl)\+K$/)
      expect(linuxShortcut).toMatch(/^(Cmd|Ctrl)\+K$/)

      expect(macComplex).toMatch(/^(Cmd|Ctrl)\+Shift\+K$/)
      expect(winComplex).toMatch(/^(Cmd|Ctrl)\+Shift\+K$/)
      expect(linuxComplex).toMatch(/^(Cmd|Ctrl)\+Shift\+K$/)

      // Windows and Linux should be identical
      expect(winShortcut).toBe(linuxShortcut)
      expect(winComplex).toBe(linuxComplex)

      // macOS should be different
      expect(macShortcut).not.toBe(winShortcut)
      expect(macComplex).not.toBe(winComplex)
    })

    it('should handle common keyboard shortcuts', () => {
      mockPlatform('MacIntel')

      // Common shortcuts from the app
      expect(formatShortcut('K')).toBe('Cmd+K') // Command palette
      expect(formatShortcut('/')).toBe('Cmd+/') // SQL editor
      expect(formatShortcut(',')).toBe('Cmd+,') // Settings
      expect(formatShortcut('R')).toBe('Cmd+R') // Refresh
      expect(formatShortcut('T')).toBe('Cmd+T') // Toggle view
      expect(formatShortcut('E')).toBe('Cmd+E') // Export
    })
  })

  describe('Edge cases', () => {
    it('should handle special characters in shortcuts', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut('[')).toBe('Cmd+[')
      expect(formatShortcut(']')).toBe('Cmd+]')
      expect(formatShortcut('\\')).toBe('Cmd+\\')
      expect(formatShortcut('`')).toBe('Cmd+`')
    })

    it('should handle function keys', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut('F1')).toBe('Cmd+F1')
      expect(formatShortcut('F12')).toBe('Cmd+F12')
    })

    it('should handle arrow keys', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut('ArrowUp')).toBe('Cmd+ArrowUp')
      expect(formatShortcut('ArrowDown')).toBe('Cmd+ArrowDown')
      expect(formatShortcut('ArrowLeft')).toBe('Cmd+ArrowLeft')
      expect(formatShortcut('ArrowRight')).toBe('Cmd+ArrowRight')
    })

    it('should handle numeric keys', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut('1')).toBe('Cmd+1')
      expect(formatShortcut('9')).toBe('Cmd+9')
      expect(formatShortcut('0')).toBe('Cmd+0')
    })

    it('should handle empty string key', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut('')).toBe('Cmd+')
    })

    it('should handle whitespace in keys', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut(' ')).toBe('Cmd+ ')
      expect(formatShortcut('Space')).toBe('Cmd+Space')
    })

    it('should preserve key casing', () => {
      mockPlatform('MacIntel')
      expect(formatShortcut('k')).toBe('Cmd+k')
      expect(formatShortcut('K')).toBe('Cmd+K')
      expect(formatShortcut('ENTER')).toBe('Cmd+ENTER')
    })
  })
})
