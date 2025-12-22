import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../../../../src/renderer/src/store/useSettingsStore'
import type { Theme } from '../../../../src/renderer/src/theme/types'

// Mock theme used across multiple test suites
const mockTheme: Theme = {
  id: 'custom-test',
  name: 'Test Theme',
  colors: {
    background: {
      primary: '#000000',
      secondary: '#111111',
      tertiary: '#222222',
      elevated: '#333333'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      tertiary: '#999999',
      inverse: '#000000'
    },
    border: {
      default: '#444444',
      subtle: '#333333',
      focus: '#0066FF'
    },
    accent: {
      primary: '#0066FF',
      hover: '#0052CC',
      active: '#003D99',
      subtle: '#E6F0FF'
    },
    semantic: {
      success: '#00CC66',
      successSubtle: '#E6F9F0',
      error: '#FF3333',
      errorSubtle: '#FFE6E6',
      warning: '#FFAA00',
      warningSubtle: '#FFF4E6',
      info: '#0099FF',
      infoSubtle: '#E6F5FF'
    },
    dataTypes: {
      uuid: '#9966FF',
      hex: '#FF6633',
      date: '#00CC99',
      json: '#FFAA00',
      boolean: '#FF3399'
    },
    special: {
      database: '#00CC66',
      overlay: '#00000080',
      scrollbar: '#444444'
    }
  }
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store to default values before each test
    useSettingsStore.getState().resetSettings()
  })

  describe('Bounds Validation', () => {
    describe('setFontSize', () => {
      it('should clamp font size to 12-16 range', () => {
        useSettingsStore.getState().setFontSize(14)
        expect(useSettingsStore.getState().fontSize).toBe(14)
      })

      it('should clamp to minimum 12', () => {
        useSettingsStore.getState().setFontSize(8)
        expect(useSettingsStore.getState().fontSize).toBe(12)
      })

      it('should clamp to maximum 16', () => {
        useSettingsStore.getState().setFontSize(20)
        expect(useSettingsStore.getState().fontSize).toBe(16)
      })

      it('should handle boundary values', () => {
        useSettingsStore.getState().setFontSize(12)
        expect(useSettingsStore.getState().fontSize).toBe(12)

        useSettingsStore.getState().setFontSize(16)
        expect(useSettingsStore.getState().fontSize).toBe(16)
      })
    })

    describe('setUiScale', () => {
      it('should clamp UI scale to 90-120 range', () => {
        useSettingsStore.getState().setUiScale(100)
        expect(useSettingsStore.getState().uiScale).toBe(100)
      })

      it('should clamp to minimum 90', () => {
        useSettingsStore.getState().setUiScale(50)
        expect(useSettingsStore.getState().uiScale).toBe(90)
      })

      it('should clamp to maximum 120', () => {
        useSettingsStore.getState().setUiScale(150)
        expect(useSettingsStore.getState().uiScale).toBe(120)
      })
    })

    describe('setDefaultChunkSize', () => {
      it('should clamp chunk size to 100-10000 range', () => {
        useSettingsStore.getState().setDefaultChunkSize(5000)
        expect(useSettingsStore.getState().defaultChunkSize).toBe(5000)
      })

      it('should clamp to minimum 100', () => {
        useSettingsStore.getState().setDefaultChunkSize(50)
        expect(useSettingsStore.getState().defaultChunkSize).toBe(100)
      })

      it('should clamp to maximum 10000', () => {
        useSettingsStore.getState().setDefaultChunkSize(20000)
        expect(useSettingsStore.getState().defaultChunkSize).toBe(10000)
      })
    })

    describe('setQueryTimeout', () => {
      it('should allow any non-negative value', () => {
        useSettingsStore.getState().setQueryTimeout(30)
        expect(useSettingsStore.getState().queryTimeout).toBe(30)
      })

      it('should clamp to minimum 0', () => {
        useSettingsStore.getState().setQueryTimeout(-10)
        expect(useSettingsStore.getState().queryTimeout).toBe(0)
      })

      it('should allow 0 (no timeout)', () => {
        useSettingsStore.getState().setQueryTimeout(0)
        expect(useSettingsStore.getState().queryTimeout).toBe(0)
      })
    })
  })

  describe('Theme Management', () => {
    describe('addCustomTheme', () => {
      it('should add new custom theme and set it active', () => {
        useSettingsStore.getState().addCustomTheme(mockTheme)

        const state = useSettingsStore.getState()
        expect(state.customThemes).toHaveLength(1)
        expect(state.customThemes[0]).toEqual(mockTheme)
        expect(state.activeTheme).toBe('custom-test')
      })

      it('should update existing theme (upsert)', () => {
        // Add theme
        useSettingsStore.getState().addCustomTheme(mockTheme)

        // Update with same ID
        const updatedTheme = { ...mockTheme, name: 'Updated Theme' }
        useSettingsStore.getState().addCustomTheme(updatedTheme)

        const state = useSettingsStore.getState()
        expect(state.customThemes).toHaveLength(1)
        expect(state.customThemes[0].name).toBe('Updated Theme')
        expect(state.activeTheme).toBe('custom-test')
      })

      it('should add multiple different themes', () => {
        const theme1 = { ...mockTheme, id: 'custom-1', name: 'Theme 1' }
        const theme2 = { ...mockTheme, id: 'custom-2', name: 'Theme 2' }

        useSettingsStore.getState().addCustomTheme(theme1)
        useSettingsStore.getState().addCustomTheme(theme2)

        const state = useSettingsStore.getState()
        expect(state.customThemes).toHaveLength(2)
        expect(state.activeTheme).toBe('custom-2')
      })
    })

    describe('updateCustomTheme', () => {
      it('should update existing theme by ID', () => {
        // Add theme
        useSettingsStore.getState().addCustomTheme(mockTheme)

        // Update
        const updatedTheme = { ...mockTheme, name: 'Updated Name' }
        useSettingsStore.getState().updateCustomTheme('custom-test', updatedTheme)

        expect(useSettingsStore.getState().customThemes[0].name).toBe('Updated Name')
      })

      it('should only update specified theme', () => {
        const theme1 = { ...mockTheme, id: 'custom-1', name: 'Theme 1' }
        const theme2 = { ...mockTheme, id: 'custom-2', name: 'Theme 2' }

        useSettingsStore.getState().addCustomTheme(theme1)
        useSettingsStore.getState().addCustomTheme(theme2)

        const updated = { ...theme1, name: 'Updated Theme 1' }
        useSettingsStore.getState().updateCustomTheme('custom-1', updated)

        const state = useSettingsStore.getState()
        expect(state.customThemes[0].name).toBe('Updated Theme 1')
        expect(state.customThemes[1].name).toBe('Theme 2')
      })
    })

    describe('removeCustomTheme', () => {
      it('should remove theme by ID', () => {
        useSettingsStore.getState().addCustomTheme(mockTheme)

        expect(useSettingsStore.getState().customThemes).toHaveLength(1)

        useSettingsStore.getState().removeCustomTheme('custom-test')

        expect(useSettingsStore.getState().customThemes).toHaveLength(0)
      })

      it('should switch to "dark" if removing active theme', () => {
        useSettingsStore.getState().addCustomTheme(mockTheme)

        expect(useSettingsStore.getState().activeTheme).toBe('custom-test')

        useSettingsStore.getState().removeCustomTheme('custom-test')

        expect(useSettingsStore.getState().activeTheme).toBe('dark')
      })

      it('should not change activeTheme if removing non-active theme', () => {
        const theme1 = { ...mockTheme, id: 'custom-1' }
        const theme2 = { ...mockTheme, id: 'custom-2' }

        useSettingsStore.getState().addCustomTheme(theme1)
        useSettingsStore.getState().addCustomTheme(theme2)

        expect(useSettingsStore.getState().activeTheme).toBe('custom-2')

        useSettingsStore.getState().removeCustomTheme('custom-1')

        expect(useSettingsStore.getState().activeTheme).toBe('custom-2')
      })
    })

    describe('getCustomTheme', () => {
      it('should retrieve theme by ID', () => {
        useSettingsStore.getState().addCustomTheme(mockTheme)

        const retrieved = useSettingsStore.getState().getCustomTheme('custom-test')
        expect(retrieved).toEqual(mockTheme)
      })

      it('should return undefined for non-existent theme', () => {
        const retrieved = useSettingsStore.getState().getCustomTheme('nonexistent')
        expect(retrieved).toBeUndefined()
      })
    })
  })

  describe('Settings Import/Export', () => {
    describe('exportSettings', () => {
      it('should export all settings', () => {
        useSettingsStore.getState().setFontSize(14)
        useSettingsStore.getState().setDefaultChunkSize(1000)

        const exported = useSettingsStore.getState().exportSettings()

        expect(exported).toHaveProperty('version')
        expect(exported).toHaveProperty('exportDate')
        expect(exported).toHaveProperty('settings')
        expect(exported.settings.fontSize).toBe(14)
        expect(exported.settings.defaultChunkSize).toBe(1000)
      })

      it('should include custom themes', () => {
        useSettingsStore.getState().addCustomTheme(mockTheme)

        const exported = useSettingsStore.getState().exportSettings()

        expect(exported.settings.customThemes).toHaveLength(1)
        expect(exported.settings.customThemes?.[0]).toEqual(mockTheme)
      })
    })

    describe('validateImportedSettings', () => {
      it('should validate valid settings', () => {
        const validSettings = {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          settings: {
            fontSize: 14,
            defaultChunkSize: 1000,
            highContrast: false
          }
        }

        const validation = useSettingsStore.getState().validateImportedSettings(JSON.stringify(validSettings))

        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
        expect(validation.settings?.fontSize).toBe(14)
        expect(validation.settings?.defaultChunkSize).toBe(1000)
      })

      it('should reject invalid JSON', () => {
        const validation = useSettingsStore.getState().validateImportedSettings('invalid json')

        expect(validation.isValid).toBe(false)
        expect(validation.errors.length).toBeGreaterThan(0)
      })

      it('should reject missing settings field', () => {
        const invalid = {
          version: '1.0.0',
          data: {}
        }

        const validation = useSettingsStore.getState().validateImportedSettings(JSON.stringify(invalid))

        expect(validation.isValid).toBe(false)
        expect(validation.errors).toContain('Invalid format: missing "settings" field')
      })

      it('should warn about out-of-range fontSize', () => {
        const settings = {
          settings: {
            fontSize: 20 // Out of range
          }
        }

        const validation = useSettingsStore.getState().validateImportedSettings(JSON.stringify(settings))

        expect(validation.warnings).toContain('fontSize out of range (12-16), using default')
        expect(validation.settings?.fontSize).toBeUndefined()
      })

      it('should warn about invalid field types', () => {
        const settings = {
          settings: {
            fontSize: 'invalid', // Should be number
            highContrast: 'yes' // Should be boolean
          }
        }

        const validation = useSettingsStore.getState().validateImportedSettings(JSON.stringify(settings))

        expect(validation.warnings.length).toBeGreaterThan(0)
      })

      it('should handle custom themes validation', () => {
        const settings = {
          settings: {
            customThemes: [mockTheme]
          }
        }

        const validation = useSettingsStore.getState().validateImportedSettings(JSON.stringify(settings))

        expect(validation.isValid).toBe(true)
        expect(validation.settings?.customThemes).toHaveLength(1)
      })

      it('should warn about invalid custom themes', () => {
        const settings = {
          settings: {
            customThemes: [
              mockTheme,
              { invalid: 'theme' }, // Missing required fields
              null
            ]
          }
        }

        const validation = useSettingsStore.getState().validateImportedSettings(JSON.stringify(settings))

        expect(validation.warnings.length).toBeGreaterThan(0)
        expect(validation.settings?.customThemes).toHaveLength(1) // Only valid theme
      })
    })

    describe('applyImportedSettings', () => {
      it('should apply validated settings', () => {
        const settingsToApply = {
          fontSize: 15,
          defaultChunkSize: 2000,
          highContrast: true
        }

        useSettingsStore.getState().applyImportedSettings(settingsToApply)

        const state = useSettingsStore.getState()
        expect(state.fontSize).toBe(15)
        expect(state.defaultChunkSize).toBe(2000)
        expect(state.highContrast).toBe(true)
      })

      it('should only apply provided fields', () => {
        const original = useSettingsStore.getState().fontSize

        useSettingsStore.getState().applyImportedSettings({ defaultChunkSize: 3000 })

        const state = useSettingsStore.getState()
        expect(state.defaultChunkSize).toBe(3000)
        expect(state.fontSize).toBe(original) // Unchanged
      })
    })
  })

  describe('Boolean Settings', () => {
    it('should toggle highContrast', () => {
      useSettingsStore.getState().setHighContrast(true)
      expect(useSettingsStore.getState().highContrast).toBe(true)

      useSettingsStore.getState().setHighContrast(false)
      expect(useSettingsStore.getState().highContrast).toBe(false)
    })

    it('should toggle reduceAnimations', () => {
      useSettingsStore.getState().setReduceAnimations(true)
      expect(useSettingsStore.getState().reduceAnimations).toBe(true)
    })

    it('should toggle showDataTypeColors', () => {
      useSettingsStore.getState().setShowDataTypeColors(false)
      expect(useSettingsStore.getState().showDataTypeColors).toBe(false)
    })

    it('should toggle overrideDynamicSizing', () => {
      useSettingsStore.getState().setOverrideDynamicSizing(true)
      expect(useSettingsStore.getState().overrideDynamicSizing).toBe(true)
    })
  })

  describe('Format Settings', () => {
    it('should set date format', () => {
      useSettingsStore.getState().setDateFormat('local')
      expect(useSettingsStore.getState().dateFormat).toBe('local')

      useSettingsStore.getState().setDateFormat('relative')
      expect(useSettingsStore.getState().dateFormat).toBe('relative')
    })

    it('should set number format', () => {
      useSettingsStore.getState().setNumberFormat('formatted')
      expect(useSettingsStore.getState().numberFormat).toBe('formatted')
    })
  })

  describe('Onboarding', () => {
    it('should mark onboarding as completed', () => {
      expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(false)

      useSettingsStore.getState().setOnboardingCompleted()

      expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true)
    })
  })

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      // Change some settings
      useSettingsStore.getState().setFontSize(16)
      useSettingsStore.getState().setDefaultChunkSize(1000)
      useSettingsStore.getState().setHighContrast(true)
      useSettingsStore.getState().addCustomTheme(mockTheme)

      expect(useSettingsStore.getState().fontSize).toBe(16)
      expect(useSettingsStore.getState().customThemes).toHaveLength(1)

      // Reset
      useSettingsStore.getState().resetSettings()

      const state = useSettingsStore.getState()
      expect(state.fontSize).toBe(13) // Default
      expect(state.defaultChunkSize).toBe(5000) // Default
      expect(state.highContrast).toBe(false)
      expect(state.customThemes).toEqual([])
    })
  })

  describe('Font Family', () => {
    it('should set font family', () => {
      useSettingsStore.getState().setFontFamily('Monaco')

      expect(useSettingsStore.getState().fontFamily).toBe('Monaco')
    })
  })

  describe('Active Theme', () => {
    it('should change active theme', () => {
      useSettingsStore.getState().setTheme('dracula')

      expect(useSettingsStore.getState().activeTheme).toBe('dracula')
    })
  })
})
