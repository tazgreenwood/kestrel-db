/**
 * Theme Builder Modal Component
 *
 * Comprehensive theme customization interface with live preview
 */

import { X, Palette, Save, RotateCcw } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { getAllThemes } from '../../theme/themes'
import type { Theme, ThemeColors } from '../../theme/types'

interface ThemeBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (theme: Theme) => void
  editingTheme?: Theme
}

export function ThemeBuilderModal({
  isOpen,
  onClose,
  onSave,
  editingTheme
}: ThemeBuilderModalProps): React.JSX.Element | null {
  const getCurrentTheme = useSettingsStore((state) => state.getCurrentTheme)
  const allThemes = getAllThemes()

  // Initialize state based on editing or creating new
  const [baseThemeId, setBaseThemeId] = useState('dark')
  const [themeName, setThemeName] = useState('My Custom Theme')
  const [themeDescription, setThemeDescription] = useState('A custom theme')
  const [colors, setColors] = useState<ThemeColors>(getCurrentTheme().colors)

  // Initialize form when editingTheme changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingTheme) {
        // Editing existing theme
        setThemeName(editingTheme.name)
        setThemeDescription(editingTheme.description)
        setColors(editingTheme.colors)
        setBaseThemeId(editingTheme.id)
      } else {
        // Creating new theme - reset to defaults
        setThemeName('My Custom Theme')
        setThemeDescription('A custom theme')
        setBaseThemeId('dark')
        setColors(getCurrentTheme().colors)
      }
    }
  }, [isOpen, editingTheme, getCurrentTheme])

  // Load base theme when changed (only if not editing)
  useEffect(() => {
    if (!editingTheme) {
      const baseTheme = allThemes.find((t) => t.id === baseThemeId)
      if (baseTheme) {
        setColors(baseTheme.colors)
      }
    }
  }, [baseThemeId, allThemes, editingTheme])

  // Reset to current theme
  const handleReset = (): void => {
    if (editingTheme) {
      // Reset to original editing theme
      setThemeName(editingTheme.name)
      setThemeDescription(editingTheme.description)
      setColors(editingTheme.colors)
    } else {
      // Reset to current theme
      const current = getCurrentTheme()
      setColors(current.colors)
      setBaseThemeId(current.id)
    }
  }

  // Update a specific color
  const updateColor = (path: string, value: string): void => {
    setColors((prev) => {
      const newColors = { ...prev }
      const keys = path.split('.')
      let current: Record<string, unknown> = newColors as Record<string, unknown>

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>
      }
      current[keys[keys.length - 1]] = value

      return newColors
    })
  }

  // Save custom theme
  const handleSave = (): void => {
    // Generate unique ID for new themes, or keep existing ID when editing
    const themeId = editingTheme
      ? editingTheme.id
      : `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const customTheme: Theme = {
      id: themeId,
      name: themeName,
      description: themeDescription,
      isDark: true,
      colors
    }
    onSave(customTheme)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[90vh] bg-secondary border border-default rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e): void => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-secondary shrink-0">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">Custom Theme Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-tertiary rounded text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Color Controls */}
          <div className="flex-1 overflow-auto custom-scrollbar p-6">
            {/* Theme Info */}
            <div className="mb-6 space-y-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Theme Name</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e): void => setThemeName(e.target.value)}
                  className="w-full bg-tertiary border border-default rounded px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="My Custom Theme"
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Description</label>
                <input
                  type="text"
                  value={themeDescription}
                  onChange={(e): void => setThemeDescription(e.target.value)}
                  className="w-full bg-tertiary border border-default rounded px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="A beautiful custom theme"
                />
              </div>

              <div>
                <label className="text-xs text-secondary mb-1 block">Start from Theme</label>
                <select
                  value={baseThemeId}
                  onChange={(e): void => setBaseThemeId(e.target.value)}
                  className="w-full bg-tertiary border border-default rounded px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {allThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color Sections */}
            <div className="space-y-6">
              {/* Background Colors */}
              <ColorSection title="Background Colors">
                <ColorInput
                  label="Primary"
                  value={colors.background.primary}
                  onChange={(v) => updateColor('background.primary', v)}
                />
                <ColorInput
                  label="Secondary"
                  value={colors.background.secondary}
                  onChange={(v) => updateColor('background.secondary', v)}
                />
                <ColorInput
                  label="Tertiary"
                  value={colors.background.tertiary}
                  onChange={(v) => updateColor('background.tertiary', v)}
                />
                <ColorInput
                  label="Elevated"
                  value={colors.background.elevated}
                  onChange={(v) => updateColor('background.elevated', v)}
                />
              </ColorSection>

              {/* Text Colors */}
              <ColorSection title="Text Colors">
                <ColorInput
                  label="Primary"
                  value={colors.text.primary}
                  onChange={(v) => updateColor('text.primary', v)}
                />
                <ColorInput
                  label="Secondary"
                  value={colors.text.secondary}
                  onChange={(v) => updateColor('text.secondary', v)}
                />
                <ColorInput
                  label="Tertiary"
                  value={colors.text.tertiary}
                  onChange={(v) => updateColor('text.tertiary', v)}
                />
                <ColorInput
                  label="Inverse"
                  value={colors.text.inverse}
                  onChange={(v) => updateColor('text.inverse', v)}
                />
              </ColorSection>

              {/* Border Colors */}
              <ColorSection title="Border Colors">
                <ColorInput
                  label="Default"
                  value={colors.border.default}
                  onChange={(v) => updateColor('border.default', v)}
                />
                <ColorInput
                  label="Subtle"
                  value={colors.border.subtle}
                  onChange={(v) => updateColor('border.subtle', v)}
                />
                <ColorInput
                  label="Focus"
                  value={colors.border.focus}
                  onChange={(v) => updateColor('border.focus', v)}
                />
              </ColorSection>

              {/* Accent Colors */}
              <ColorSection title="Accent Colors">
                <ColorInput
                  label="Primary"
                  value={colors.accent.primary}
                  onChange={(v) => updateColor('accent.primary', v)}
                />
                <ColorInput
                  label="Hover"
                  value={colors.accent.hover}
                  onChange={(v) => updateColor('accent.hover', v)}
                />
                <ColorInput
                  label="Active"
                  value={colors.accent.active}
                  onChange={(v) => updateColor('accent.active', v)}
                />
                <ColorInput
                  label="Subtle"
                  value={colors.accent.subtle}
                  onChange={(v) => updateColor('accent.subtle', v)}
                />
              </ColorSection>

              {/* Semantic Colors */}
              <ColorSection title="Semantic Colors">
                <ColorInput
                  label="Success"
                  value={colors.semantic.success}
                  onChange={(v) => updateColor('semantic.success', v)}
                />
                <ColorInput
                  label="Success Subtle"
                  value={colors.semantic.successSubtle}
                  onChange={(v) => updateColor('semantic.successSubtle', v)}
                />
                <ColorInput
                  label="Error"
                  value={colors.semantic.error}
                  onChange={(v) => updateColor('semantic.error', v)}
                />
                <ColorInput
                  label="Error Subtle"
                  value={colors.semantic.errorSubtle}
                  onChange={(v) => updateColor('semantic.errorSubtle', v)}
                />
                <ColorInput
                  label="Warning"
                  value={colors.semantic.warning}
                  onChange={(v) => updateColor('semantic.warning', v)}
                />
                <ColorInput
                  label="Warning Subtle"
                  value={colors.semantic.warningSubtle}
                  onChange={(v) => updateColor('semantic.warningSubtle', v)}
                />
                <ColorInput
                  label="Info"
                  value={colors.semantic.info}
                  onChange={(v) => updateColor('semantic.info', v)}
                />
                <ColorInput
                  label="Info Subtle"
                  value={colors.semantic.infoSubtle}
                  onChange={(v) => updateColor('semantic.infoSubtle', v)}
                />
              </ColorSection>

              {/* Data Type Colors */}
              <ColorSection title="Data Type Colors">
                <ColorInput
                  label="UUID"
                  value={colors.dataTypes.uuid}
                  onChange={(v) => updateColor('dataTypes.uuid', v)}
                />
                <ColorInput
                  label="Hex"
                  value={colors.dataTypes.hex}
                  onChange={(v) => updateColor('dataTypes.hex', v)}
                />
                <ColorInput
                  label="Date"
                  value={colors.dataTypes.date}
                  onChange={(v) => updateColor('dataTypes.date', v)}
                />
                <ColorInput
                  label="JSON"
                  value={colors.dataTypes.json}
                  onChange={(v) => updateColor('dataTypes.json', v)}
                />
                <ColorInput
                  label="Boolean True"
                  value={colors.dataTypes.boolean.true}
                  onChange={(v) => updateColor('dataTypes.boolean.true', v)}
                />
                <ColorInput
                  label="Boolean False"
                  value={colors.dataTypes.boolean.false}
                  onChange={(v) => updateColor('dataTypes.boolean.false', v)}
                />
              </ColorSection>

              {/* Special Colors */}
              <ColorSection title="Special Colors">
                <ColorInput
                  label="Database"
                  value={colors.special.database}
                  onChange={(v) => updateColor('special.database', v)}
                />
                <ColorInput
                  label="Overlay"
                  value={colors.special.overlay}
                  onChange={(v) => updateColor('special.overlay', v)}
                />
                <ColorInput
                  label="Scrollbar"
                  value={colors.special.scrollbar}
                  onChange={(v) => updateColor('special.scrollbar', v)}
                />
                <ColorInput
                  label="Scrollbar Hover"
                  value={colors.special.scrollbarHover}
                  onChange={(v) => updateColor('special.scrollbarHover', v)}
                />
              </ColorSection>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-80 border-l border-default bg-primary p-6 overflow-auto custom-scrollbar">
            <h3 className="text-sm font-semibold text-primary mb-4">Live Preview</h3>

            {/* Preview Card */}
            <div
              className="rounded-lg border p-4 mb-4"
              style={{
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.default
              }}
            >
              <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>
                Sample Card
              </h4>
              <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                This is how your theme will look
              </p>
              <button
                className="px-3 py-1.5 rounded text-sm text-white"
                style={{ backgroundColor: colors.accent.primary }}
              >
                Primary Button
              </button>
            </div>

            {/* Color Swatches */}
            <div className="space-y-3">
              <ColorSwatch label="Success" color={colors.semantic.success} />
              <ColorSwatch label="Error" color={colors.semantic.error} />
              <ColorSwatch label="Warning" color={colors.semantic.warning} />
              <ColorSwatch label="Info" color={colors.semantic.info} />
              <ColorSwatch label="UUID" color={colors.dataTypes.uuid} />
              <ColorSwatch label="Date" color={colors.dataTypes.date} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-default bg-secondary shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white hover:bg-accent-hover rounded text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Color Section Component
function ColorSection({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="border border-default rounded-lg p-4 bg-primary">
      <h4 className="text-sm font-semibold text-primary mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

// Color Input Component
function ColorInput({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <div>
      <label className="text-xs text-secondary mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value.length === 9 ? value.slice(0, 7) : value}
          onChange={(e): void => onChange(e.target.value)}
          className="w-10 h-10 rounded border border-default cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e): void => onChange(e.target.value)}
          className="flex-1 bg-tertiary border border-default rounded px-2 py-1 text-xs text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
    </div>
  )
}

// Color Swatch Component
function ColorSwatch({ label, color }: { label: string; color: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded border border-default" style={{ backgroundColor: color }} />
      <span className="text-xs text-secondary">{label}</span>
    </div>
  )
}
