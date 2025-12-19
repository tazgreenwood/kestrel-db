/**
 * Settings Modal Component
 *
 * Multi-tab settings interface for theme, appearance, and preferences
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Palette,
  Database,
  Info,
  Download,
  Upload,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Keyboard,
  BookOpen
} from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { ImportValidationResult } from '../../store/useSettingsStore'
import type { Theme } from '../../theme/types'
import { getAllThemes } from '../../theme/themes'
import { ImportPreviewModal } from './ImportPreviewModal'
import { ThemeBuilderModal } from './ThemeBuilderModal'
import { ThemeImportModal } from './ThemeImportModal'
import { getModifierKey } from '../../utils/platform'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabId = 'appearance' | 'data' | 'shortcuts' | 'query-syntax' | 'about'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<TabId>('appearance')

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[600px] bg-secondary border border-default rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-secondary shrink-0">
          <h2 className="text-lg font-semibold text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-tertiary rounded text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-default bg-primary p-2 shrink-0">
            <nav className="space-y-1">
              <TabButton
                icon={Palette}
                label="Appearance"
                active={activeTab === 'appearance'}
                onClick={() => setActiveTab('appearance')}
              />
              <TabButton
                icon={Database}
                label="Data & Performance"
                active={activeTab === 'data'}
                onClick={() => setActiveTab('data')}
              />
              <TabButton
                icon={Keyboard}
                label="Keyboard Shortcuts"
                active={activeTab === 'shortcuts'}
                onClick={() => setActiveTab('shortcuts')}
              />
              <TabButton
                icon={BookOpen}
                label="Query Syntax"
                active={activeTab === 'query-syntax'}
                onClick={() => setActiveTab('query-syntax')}
              />
              <TabButton
                icon={Info}
                label="About"
                active={activeTab === 'about'}
                onClick={() => setActiveTab('about')}
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-primary p-6">
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'data' && <DataPerformanceTab />}
            {activeTab === 'shortcuts' && <ShortcutsTab />}
            {activeTab === 'query-syntax' && <QuerySyntaxTab />}
            {activeTab === 'about' && <AboutTab onClose={onClose} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
        active
          ? 'bg-accent-subtle text-accent border border-accent'
          : 'text-secondary hover:text-primary hover:bg-secondary'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}

// Appearance Tab
function AppearanceTab(): React.JSX.Element {
  const {
    activeTheme,
    setTheme,
    customThemes,
    addCustomTheme,
    removeCustomTheme,
    exportTheme,
    importTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    uiScale,
    setUiScale,
    highContrast,
    setHighContrast,
    reduceAnimations,
    setReduceAnimations
  } = useSettingsStore()

  const [isThemeBuilderOpen, setIsThemeBuilderOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<Theme | undefined>(undefined)
  const [copiedThemeId, setCopiedThemeId] = useState<string | null>(null)

  const baseColorSelectorRef = useRef<HTMLDivElement>(null)
  const previousDarkVariantRef = useRef<boolean>(false)
  const isInitialMount = useRef(true)

  const builtInThemes = getAllThemes()

  // Filter out base color variants - we'll show them separately
  const filteredBuiltInThemes = builtInThemes.filter(
    (theme) =>
      !['dark-zinc', 'dark-slate', 'dark-gray', 'dark-neutral', 'dark-stone'].includes(theme.id)
  )

  // Combine built-in and custom themes
  const allDisplayThemes = [...filteredBuiltInThemes, ...customThemes]

  // Check if current theme is a base variant
  const isDarkVariant = [
    'dark',
    'dark-zinc',
    'dark-slate',
    'dark-gray',
    'dark-neutral',
    'dark-stone'
  ].includes(activeTheme)

  // Get current base color (default to zinc for Dark theme)
  const currentBaseColor = activeTheme.startsWith('dark-')
    ? activeTheme.replace('dark-', '')
    : 'zinc'

  // Base color options
  const baseColors = [
    { id: 'zinc', name: 'Zinc', color: '#09090b', description: 'Neutral gray' },
    { id: 'slate', name: 'Slate', color: '#020617', description: 'Cool blue undertones' },
    { id: 'gray', name: 'Gray', color: '#030712', description: 'True neutral' },
    { id: 'neutral', name: 'Neutral', color: '#0a0a0a', description: 'Warm brown undertones' },
    { id: 'stone', name: 'Stone', color: '#0c0a09', description: 'Warm beige undertones' }
  ]

  // Scroll to base color selector when Dark theme is selected (not on mount)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      previousDarkVariantRef.current = isDarkVariant
      return
    }

    const wasDarkVariant = previousDarkVariantRef.current
    previousDarkVariantRef.current = isDarkVariant

    // Only scroll if it changed from false to true (user just selected Dark theme)
    if (!wasDarkVariant && isDarkVariant && baseColorSelectorRef.current) {
      setTimeout(() => {
        baseColorSelectorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }, 100)
    }
  }, [isDarkVariant])

  const handleBaseColorChange = (colorId: string): void => {
    const themeId = colorId === 'zinc' ? 'dark' : `dark-${colorId}`
    setTheme(themeId)
  }

  const handleSaveCustomTheme = (theme: Theme): void => {
    addCustomTheme(theme)
    setIsThemeBuilderOpen(false)
    setEditingTheme(undefined)
  }

  const handleEditTheme = (theme: Theme): void => {
    setEditingTheme(theme)
    setIsThemeBuilderOpen(true)
  }

  const handleDeleteTheme = (themeId: string): void => {
    if (confirm('Delete this custom theme? This cannot be undone.')) {
      removeCustomTheme(themeId)
    }
  }

  const handleCopyThemeJSON = (themeId: string): void => {
    try {
      const exported = exportTheme(themeId)
      if (!exported) {
        alert('Theme not found')
        return
      }

      const json = JSON.stringify(exported, null, 2)
      navigator.clipboard.writeText(json)
      setCopiedThemeId(themeId)
      setTimeout(() => setCopiedThemeId(null), 2000)
    } catch (error) {
      alert(`Failed to copy theme: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleImportThemeJSON = (jsonString: string): void => {
    try {
      const validation = importTheme(jsonString)
      if (validation.isValid && validation.theme) {
        addCustomTheme(validation.theme)
        setIsImportModalOpen(false)
        alert(`Theme "${validation.theme.name}" imported successfully!`)
      } else {
        alert(`Invalid theme:\n${validation.errors.join('\n')}`)
      }
    } catch (error) {
      alert(`Failed to import theme: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const isCustomTheme = (themeId: string): boolean => {
    return customThemes.some((t) => t.id === themeId)
  }

  // Check if font family is one of our presets
  const isPresetFont = (font: string): boolean => {
    const presets = [
      'ui-monospace',
      "'JetBrains Mono', ui-monospace, monospace",
      "'SF Mono', 'Menlo', 'Monaco', ui-monospace, monospace",
      "'Cascadia Code', 'Consolas', 'Courier New', ui-monospace, monospace",
      "'DejaVu Sans Mono', 'Liberation Mono', ui-monospace, monospace"
    ]
    return presets.includes(font)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Font</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-secondary mb-1 block">Font Family</label>
            <select
              value={fontFamily === 'custom' || !isPresetFont(fontFamily) ? 'custom' : fontFamily}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  // Will show custom input below
                  setFontFamily('custom')
                } else {
                  setFontFamily(e.target.value)
                }
              }}
              className="w-full bg-secondary border border-default rounded px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="ui-monospace">System Default</option>
              <option value="'JetBrains Mono', ui-monospace, monospace">
                JetBrains Mono (Recommended)
              </option>
              {window.api.platform === 'darwin' && (
                <option value="'SF Mono', 'Menlo', 'Monaco', ui-monospace, monospace">
                  SF Mono (macOS)
                </option>
              )}
              {window.api.platform === 'win32' && (
                <option value="'Cascadia Code', 'Consolas', 'Courier New', ui-monospace, monospace">
                  Cascadia Code (Windows)
                </option>
              )}
              {window.api.platform === 'linux' && (
                <option value="'DejaVu Sans Mono', 'Liberation Mono', ui-monospace, monospace">
                  DejaVu Sans Mono (Linux)
                </option>
              )}
              <option value="custom">Custom...</option>
            </select>

            {/* Custom font input */}
            {(fontFamily === 'custom' || !isPresetFont(fontFamily)) && (
              <div className="mt-2">
                <label className="text-xs text-tertiary mb-1 block">
                  Custom Font Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={fontFamily === 'custom' ? '' : fontFamily}
                  onChange={(e) => setFontFamily(e.target.value || 'ui-monospace')}
                  placeholder="'My Font', 'Fallback Font', monospace"
                  className="w-full bg-tertiary border border-default rounded px-3 py-2 text-xs text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-tertiary mt-1">
                  {"Example: 'Fira Code', 'Source Code Pro', monospace"}
                </p>
              </div>
            )}

            {/* Font preview */}
            {fontFamily !== 'custom' && (
              <div className="mt-3 p-3 bg-tertiary border border-default rounded">
                <p className="text-xs text-tertiary mb-1">Preview:</p>
                <p
                  className="text-sm text-primary"
                  style={{ fontFamily: fontFamily || 'ui-monospace' }}
                >
                  The quick brown fox jumps over the lazy dog
                  <br />
                  0123456789 !== === {'<>'} () [] {'{}'} ;
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-secondary mb-1 block">Font Size ({fontSize}px)</label>
            <input
              type="range"
              min="12"
              max="16"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-tertiary mt-1">
              <span>12px</span>
              <span>16px</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">UI Scale ({uiScale}%)</h3>
        <input
          type="range"
          min="90"
          max="120"
          step="10"
          value={uiScale}
          onChange={(e) => setUiScale(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-tertiary mt-1">
          <span>90%</span>
          <span>100%</span>
          <span>110%</span>
          <span>120%</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Accessibility</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="w-4 h-4 rounded border-default bg-tertiary text-accent focus:ring-accent"
            />
            <div>
              <div className="text-sm text-primary">High Contrast Mode</div>
              <div className="text-xs text-secondary">Increase contrast for better readability</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceAnimations}
              onChange={(e) => setReduceAnimations(e.target.checked)}
              className="w-4 h-4 rounded border-default bg-tertiary text-accent focus:ring-accent"
            />
            <div>
              <div className="text-sm text-primary">Reduce Animations</div>
              <div className="text-xs text-secondary">Minimize motion for accessibility</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">Theme</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-default text-secondary hover:text-primary hover:border-focus rounded text-xs transition-colors"
            >
              <Upload className="w-3 h-3" />
              Import JSON
            </button>
            <button
              onClick={() => {
                setEditingTheme(undefined)
                setIsThemeBuilderOpen(true)
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent-subtle border border-accent text-accent hover:bg-accent hover:text-white rounded text-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              Create Custom
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {allDisplayThemes.map((theme) => (
            <div
              key={theme.id}
              className={`relative p-4 rounded-lg border transition-all ${
                isDarkVariant && theme.id === 'dark'
                  ? 'border-accent bg-accent-subtle'
                  : activeTheme === theme.id
                    ? 'border-accent bg-accent-subtle'
                    : 'border-default bg-secondary hover:border-default'
              }`}
            >
              <button onClick={() => setTheme(theme.id)} className="w-full text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded border border-default shrink-0"
                    style={{ backgroundColor: theme.colors.background.primary }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary truncate">{theme.name}</div>
                    <div className="text-xs text-secondary truncate">{theme.description}</div>
                    {theme.author && (
                      <div className="text-xs text-tertiary truncate">by {theme.author}</div>
                    )}
                  </div>
                </div>
                {/* Color Preview */}
                <div className="flex gap-1 mt-2">
                  <div
                    className="h-2 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.accent.primary }}
                  />
                  <div
                    className="h-2 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.semantic.success }}
                  />
                  <div
                    className="h-2 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.semantic.warning }}
                  />
                  <div
                    className="h-2 flex-1 rounded"
                    style={{ backgroundColor: theme.colors.semantic.error }}
                  />
                </div>
              </button>

              {/* Action buttons for custom themes */}
              {isCustomTheme(theme.id) && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-subtle">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditTheme(theme)
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-tertiary rounded transition-colors"
                    title="Edit theme"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyThemeJSON(theme.id)
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-tertiary rounded transition-colors"
                    title="Copy theme JSON to clipboard"
                  >
                    {copiedThemeId === theme.id ? (
                      <>
                        <Check className="w-3 h-3 text-success" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy JSON
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTheme(theme.id)
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-error hover:text-white hover:bg-error rounded transition-colors ml-auto"
                    title="Delete theme"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Base Color Selector - Shows when Dark theme is selected */}
        {isDarkVariant && (
          <div
            ref={baseColorSelectorRef}
            className="mt-4 p-4 bg-secondary border border-default rounded-lg"
          >
            <label className="text-xs text-secondary mb-2 block">Base Color</label>
            <p className="text-xs text-tertiary mb-3">
              Adjust the background color temperature for the Dark theme
            </p>
            <div className="grid grid-cols-5 gap-2">
              {baseColors.map((baseColor) => (
                <button
                  key={baseColor.id}
                  onClick={() => handleBaseColorChange(baseColor.id)}
                  className={`p-3 rounded border transition-all ${
                    currentBaseColor === baseColor.id
                      ? 'border-accent bg-accent-subtle'
                      : 'border-subtle hover:border-default'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded border border-default mb-2"
                    style={{ backgroundColor: baseColor.color }}
                  />
                  <div className="text-xs font-medium text-primary text-center">
                    {baseColor.name}
                  </div>
                  <div className="text-[10px] text-tertiary text-center mt-0.5">
                    {baseColor.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme Builder Modal */}
      <ThemeBuilderModal
        isOpen={isThemeBuilderOpen}
        onClose={() => {
          setIsThemeBuilderOpen(false)
          setEditingTheme(undefined)
        }}
        onSave={handleSaveCustomTheme}
        editingTheme={editingTheme}
      />

      {/* Theme Import Modal */}
      <ThemeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportThemeJSON}
      />
    </div>
  )
}

// Data & Performance Tab
function DataPerformanceTab(): React.JSX.Element {
  const {
    defaultChunkSize,
    setDefaultChunkSize,
    overrideDynamicSizing,
    setOverrideDynamicSizing,
    queryTimeout,
    setQueryTimeout,
    showDataTypeColors,
    setShowDataTypeColors,
    dateFormat,
    setDateFormat,
    numberFormat,
    setNumberFormat
  } = useSettingsStore()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Query Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-secondary mb-1 block">
              Default Chunk Size ({defaultChunkSize.toLocaleString()} rows)
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={defaultChunkSize}
              onChange={(e) => setDefaultChunkSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-tertiary mt-1">
              <span>100</span>
              <span>10,000</span>
            </div>
            <p className="text-xs text-tertiary mt-2">
              Number of rows to load per query. Larger values = fewer queries but more memory usage.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={overrideDynamicSizing}
              onChange={(e) => setOverrideDynamicSizing(e.target.checked)}
              className="w-4 h-4 rounded border-default bg-tertiary text-accent focus:ring-accent"
            />
            <div>
              <div className="text-sm text-primary">Override Dynamic Sizing</div>
              <div className="text-xs text-secondary">
                Always use default chunk size instead of calculating based on table size
              </div>
            </div>
          </label>

          <div>
            <label className="text-xs text-secondary mb-1 block">
              Query Timeout ({queryTimeout === 0 ? 'No limit' : `${queryTimeout}s`})
            </label>
            <input
              type="range"
              min="0"
              max="120"
              step="10"
              value={queryTimeout}
              onChange={(e) => setQueryTimeout(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-tertiary mt-1">
              <span>None</span>
              <span>30s</span>
              <span>60s</span>
              <span>120s</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-primary mb-3">Display Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showDataTypeColors}
              onChange={(e) => setShowDataTypeColors(e.target.checked)}
              className="w-4 h-4 rounded border-default bg-tertiary text-accent focus:ring-accent"
            />
            <div>
              <div className="text-sm text-primary">Show Data Type Colors</div>
              <div className="text-xs text-secondary">
                Highlight UUIDs, dates, JSON, and other special data types
              </div>
            </div>
          </label>

          <div>
            <label className="text-xs text-secondary mb-1 block">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as 'iso' | 'local' | 'relative')}
              className="w-full bg-secondary border border-default rounded px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="iso">ISO 8601 (2024-01-15T10:30:00Z)</option>
              <option value="local">Local (Jan 15, 2024, 10:30:00 AM)</option>
              <option value="relative">Relative (2 hours ago)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-secondary mb-1 block">Number Format</label>
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value as 'raw' | 'formatted')}
              className="w-full bg-secondary border border-default rounded px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="raw">Raw (1234567.89)</option>
              <option value="formatted">Formatted (1,234,567.89)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// Shortcuts Tab
function ShortcutsTab(): React.JSX.Element {
  const modKey = getModifierKey()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Keyboard Shortcuts</h2>
        <p className="text-sm text-secondary">
          Learn keyboard shortcuts to navigate and work faster in Kestrel DB.
        </p>
      </div>

      {/* Global Shortcuts */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">Global</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Open Command Palette</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+K
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Open Settings</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+,
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Refresh Table</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+R
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Export Table</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+E
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Toggle Data/Structure View</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+T
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Close Window</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+W
            </kbd>
          </div>
        </div>
      </div>

      {/* Grid Navigation */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">Grid Navigation</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Move Cell</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                ↑↓←→
              </kbd>
              <span className="text-tertiary">or</span>
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                h j k l
              </kbd>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">First Column</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                Home
              </kbd>
              <span className="text-tertiary">or</span>
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                0
              </kbd>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Last Column</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                End
              </kbd>
              <span className="text-tertiary">or</span>
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                $
              </kbd>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">First Row</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              gg
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Last Row</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              G
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Page Down</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              Ctrl+D
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Page Up</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              Ctrl+U
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Open Cell Detail</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              Shift+Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Copy Cell/Rows</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              {modKey}+C
            </kbd>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">Command Palette</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Navigate Down</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                ↓
              </kbd>
              <span className="text-tertiary">or</span>
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                Ctrl+N
              </kbd>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Navigate Up</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                ↑
              </kbd>
              <span className="text-tertiary">or</span>
              <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
                Ctrl+P
              </kbd>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Select Item</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Quick Actions</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              /
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Filter Table</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              ?
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Switch Database</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              &gt;
            </kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-secondary">Close</span>
            <kbd className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-primary">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  )
}

// Query Syntax Tab
function QuerySyntaxTab(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary mb-2">Query Filter Syntax</h2>
        <p className="text-sm text-secondary">
          Use the command palette (type{' '}
          <kbd className="px-1.5 py-0.5 bg-tertiary border border-default rounded text-xs font-mono">
            ?
          </kbd>
          ) to filter table rows with a powerful query language.
        </p>
      </div>

      {/* Basic Operators */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">Basic Operators</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?id=1234
            </code>
            <span className="text-sm text-secondary">Equals - exact match</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?id&gt;1000
            </code>
            <span className="text-sm text-secondary">Greater than</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?id&lt;1000
            </code>
            <span className="text-sm text-secondary">Less than</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?id&gt;=1000
            </code>
            <span className="text-sm text-secondary">Greater than or equal</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?id&lt;=1000
            </code>
            <span className="text-sm text-secondary">Less than or equal</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?id!=1000
            </code>
            <span className="text-sm text-secondary">Not equal</span>
          </div>
        </div>
      </div>

      {/* String Matching */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">String Matching</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?name*john
            </code>
            <span className="text-sm text-secondary">Contains - matches anywhere in string</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?name^john
            </code>
            <span className="text-sm text-secondary">Starts with - matches beginning</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              ?name$john
            </code>
            <span className="text-sm text-secondary">Ends with - matches end</span>
          </div>
        </div>
      </div>

      {/* Date Helpers */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">Date & Time Helpers</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @now
            </code>
            <span className="text-sm text-secondary">Current timestamp</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @today
            </code>
            <span className="text-sm text-secondary">{"Today's date"}</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @yesterday
            </code>
            <span className="text-sm text-secondary">{"Yesterday's date"}</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @7d
            </code>
            <span className="text-sm text-secondary">7 days ago</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @1h
            </code>
            <span className="text-sm text-secondary">1 hour ago (also: 2h, 3h, etc.)</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @1w
            </code>
            <span className="text-sm text-secondary">1 week ago</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @1m
            </code>
            <span className="text-sm text-secondary">1 month ago</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[100px]">
              @1y
            </code>
            <span className="text-sm text-secondary">1 year ago</span>
          </div>
        </div>
      </div>

      {/* Combining Conditions */}
      <div>
        <h3 className="text-sm font-semibold text-accent mb-3">Combining Conditions</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[180px]">
              ?id&gt;100&amp;status=active
            </code>
            <span className="text-sm text-secondary">AND - both conditions must match</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[180px]">
              ?id&gt;100|name=john
            </code>
            <span className="text-sm text-secondary">OR - either condition can match</span>
          </div>
          <div className="flex items-start gap-3 py-2">
            <code className="px-2 py-1 bg-tertiary border border-default rounded text-xs font-mono text-accent min-w-[180px]">
              ?id&gt;100&amp;status=active|name=john
            </code>
            <span className="text-sm text-secondary">
              Complex - group with AND, separate with OR
            </span>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="bg-secondary/50 border border-default rounded-lg p-4">
        <h3 className="text-sm font-semibold text-accent mb-3">Examples</h3>
        <div className="space-y-3">
          <div>
            <code className="text-xs text-accent font-mono">?created_at&gt;@7d</code>
            <p className="text-xs text-tertiary mt-1">Find rows created in the last 7 days</p>
          </div>
          <div>
            <code className="text-xs text-accent font-mono">?email*@gmail.com</code>
            <p className="text-xs text-tertiary mt-1">Find all Gmail email addresses</p>
          </div>
          <div>
            <code className="text-xs text-accent font-mono">?status=active&amp;age&gt;=18</code>
            <p className="text-xs text-tertiary mt-1">Find active users 18 or older</p>
          </div>
          <div>
            <code className="text-xs text-accent font-mono">?role=admin|role=moderator</code>
            <p className="text-xs text-tertiary mt-1">Find users who are admins or moderators</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// About Tab
function AboutTab({ onClose }: { onClose: () => void }): React.JSX.Element {
  const resetSettings = useSettingsStore((state) => state.resetSettings)
  const exportSettings = useSettingsStore((state) => state.exportSettings)
  const validateImportedSettings = useSettingsStore((state) => state.validateImportedSettings)
  const applyImportedSettings = useSettingsStore((state) => state.applyImportedSettings)

  const [copied, setCopied] = useState(false)
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false)
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)

  // Auto-update state
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  >('idle')
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseNotes?: string } | null>(
    null
  )
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Get current version on mount
  useEffect(() => {
    const loadVersion = async (): Promise<void> => {
      const result = await window.api.update.getVersion()
      if (result.success && result.data) {
        setCurrentVersion(result.data)
      }
    }
    loadVersion()

    // Set up update event listeners
    const unsubChecking = window.api.update.onChecking((): void => {
      setUpdateStatus('checking')
      setErrorMessage('')
    })

    const unsubAvailable = window.api.update.onAvailable((info): void => {
      setUpdateStatus('available')
      setUpdateInfo(info)
    })

    const unsubNotAvailable = window.api.update.onNotAvailable((): void => {
      setUpdateStatus('not-available')
    })

    const unsubError = window.api.update.onError((error): void => {
      setUpdateStatus('error')
      setErrorMessage(error)
    })

    const unsubProgress = window.api.update.onDownloadProgress((progress): void => {
      setUpdateStatus('downloading')
      setDownloadProgress(progress.percent || 0)
    })

    const unsubDownloaded = window.api.update.onDownloaded((): void => {
      setUpdateStatus('downloaded')
      setDownloadProgress(100)
    })

    // Cleanup
    return () => {
      unsubChecking()
      unsubAvailable()
      unsubNotAvailable()
      unsubError()
      unsubProgress()
      unsubDownloaded()
    }
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    setUpdateStatus('checking')
    setErrorMessage('')
    await window.api.update.checkForUpdates()
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    setUpdateStatus('downloading')
    setDownloadProgress(0)
    await window.api.update.downloadUpdate()
  }

  const handleInstallUpdate = async (): Promise<void> => {
    await window.api.update.installUpdate()
    // App will quit and restart
  }

  const handleReset = (): void => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      resetSettings()
      onClose()
    }
  }

  const handleExport = async (): Promise<void> => {
    try {
      const exported = exportSettings()
      const json = JSON.stringify(exported, null, 2)

      // Show save dialog
      const filePath = await window.api.dialog.saveSettings()
      if (filePath) {
        // Write to file
        await window.api.fs.writeSettings(filePath, json)
        alert('Settings exported successfully!')
      }
    } catch (error) {
      alert(`Failed to export settings: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleImport = async (): Promise<void> => {
    try {
      // Show open dialog
      const filePath = await window.api.dialog.openSettings()
      if (filePath) {
        // Read file
        const jsonContent = await window.api.fs.readSettings(filePath)
        // Validate settings
        const validation = validateImportedSettings(jsonContent)
        setValidationResult(validation)
        setIsImportPreviewOpen(true)
      }
    } catch (error) {
      alert(`Failed to import settings: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleConfirmImport = (): void => {
    if (validationResult && validationResult.isValid && validationResult.settings) {
      applyImportedSettings(validationResult.settings)
      setIsImportPreviewOpen(false)
      setValidationResult(null)
      alert('Settings imported successfully!')
    }
  }

  const handleCopyToClipboard = (): void => {
    try {
      const exported = exportSettings()
      const json = JSON.stringify(exported, null, 2)
      navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      alert(
        `Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Kestrel DB</h3>
          <p className="text-sm text-secondary mb-1">Version {currentVersion || '1.0.0'}</p>
          <p className="text-xs text-tertiary">Precision Data Exploration for MySQL</p>
        </div>

        {/* Auto-Update Section */}
        <div className="pt-6 border-t border-default">
          <h3 className="text-sm font-semibold text-primary mb-3">Software Updates</h3>
          <p className="text-xs text-tertiary mb-4">
            Check for and install the latest version of Kestrel DB
          </p>

          {/* Update Status */}
          <div className="bg-secondary border border-default rounded-lg p-4 mb-4">
            {updateStatus === 'idle' && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Info className="w-4 h-4" />
                {'Click "Check for Updates" to see if a new version is available'}
              </div>
            )}

            {updateStatus === 'checking' && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking for updates...
              </div>
            )}

            {updateStatus === 'available' && updateInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  Update available: v{updateInfo.version}
                </div>
                {updateInfo.releaseNotes && (
                  <p className="text-xs text-tertiary pl-6">
                    {updateInfo.releaseNotes.substring(0, 200)}...
                  </p>
                )}
              </div>
            )}

            {updateStatus === 'not-available' && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                {"You're running the latest version!"}
              </div>
            )}

            {updateStatus === 'downloading' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading update... {Math.round(downloadProgress)}%
                </div>
                <div className="w-full bg-tertiary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {updateStatus === 'downloaded' && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                Update downloaded and ready to install
              </div>
            )}

            {updateStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-error">
                <AlertCircle className="w-4 h-4" />
                Error: {errorMessage || 'Failed to check for updates'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {(updateStatus === 'idle' ||
              updateStatus === 'not-available' ||
              updateStatus === 'error') && (
              <button
                onClick={handleCheckForUpdates}
                className="flex items-center gap-2 px-4 py-2 bg-accent-subtle border border-accent text-accent hover:bg-accent hover:text-white rounded text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Check for Updates
              </button>
            )}

            {updateStatus === 'available' && (
              <button
                onClick={handleDownloadUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-accent-subtle border border-accent text-accent hover:bg-accent hover:text-white rounded text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Update
              </button>
            )}

            {updateStatus === 'downloaded' && (
              <button
                onClick={handleInstallUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-success-subtle border border-success text-success hover:bg-green-500 hover:text-white rounded text-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Install and Restart
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary mb-2">Credits</h3>
          <div className="text-sm text-secondary space-y-1">
            <p>Built with Electron, React, and TypeScript</p>
            <p>UI powered by Tailwind CSS</p>
            <p>Icons by Lucide</p>
            <p>Themes: Catppuccin, Dracula, One Dark Pro, Tokyo Night</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="pt-6 border-t border-default">
          <div className="bg-warning-subtle border border-warning/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">Important Notice</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  {
                    'Kestrel DB is free, open source software provided "as is" without warranty of any kind. While we strive for reliability:'
                  }
                </p>
                <ul className="text-xs text-secondary space-y-1 ml-4 list-disc">
                  <li>Always backup your data before performing operations</li>
                  <li>Test on non-production databases first</li>
                  <li>No guarantee of uptime or data safety</li>
                  <li>Use at your own risk</li>
                </ul>
                <p className="text-xs text-tertiary mt-3">
                  See the{' '}
                  <a
                    href="https://github.com/tazgreenwood/kestrel-db/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    LICENSE
                  </a>{' '}
                  for full details.
                </p>
                <p className="text-xs text-tertiary mt-2">
                  Copyright © 2025 Taz Greenwood. MIT License.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Management */}
        <div className="pt-6 border-t border-default">
          <h3 className="text-sm font-semibold text-primary mb-3">Settings Management</h3>
          <p className="text-xs text-tertiary mb-4">
            Export your settings to share across devices or with teammates
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-accent-subtle border border-accent text-accent hover:bg-accent hover:text-white rounded text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Settings
            </button>

            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 bg-accent-subtle border border-accent text-accent hover:bg-accent hover:text-white rounded text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Settings
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-default text-secondary hover:text-primary hover:border-focus rounded text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="pt-6 border-t border-default">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-error-subtle border border-error text-error hover:bg-red-500/20 rounded text-sm transition-colors"
          >
            Reset All Settings
          </button>
          <p className="text-xs text-tertiary mt-2">
            This will reset all settings to their default values
          </p>
        </div>
      </div>

      {/* Import Preview Modal */}
      {validationResult && (
        <ImportPreviewModal
          isOpen={isImportPreviewOpen}
          validationResult={validationResult}
          onClose={() => {
            setIsImportPreviewOpen(false)
            setValidationResult(null)
          }}
          onConfirm={handleConfirmImport}
        />
      )}
    </>
  )
}
