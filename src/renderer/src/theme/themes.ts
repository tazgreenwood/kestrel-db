/**
 * Prebuilt Themes for Kestrel DB
 *
 * Includes popular developer themes and custom variants
 */

import type { Theme } from './types'

/**
 * Base color palettes from Tailwind
 */
const tailwindColors = {
  zinc: {
    950: '#09090b',
    900: '#18181b',
    800: '#27272a',
    700: '#3f3f46',
    600: '#52525b',
    500: '#71717a',
    400: '#a1a1aa',
    300: '#d4d4d8'
  },
  slate: {
    950: '#020617',
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1'
  },
  gray: {
    950: '#030712',
    900: '#111827',
    800: '#1f2937',
    700: '#374151',
    600: '#4b5563',
    500: '#6b7280',
    400: '#9ca3af',
    300: '#d1d5db'
  },
  neutral: {
    950: '#0a0a0a',
    900: '#171717',
    800: '#262626',
    700: '#404040',
    600: '#525252',
    500: '#737373',
    400: '#a3a3a3',
    300: '#d4d4d4'
  },
  stone: {
    950: '#0c0a09',
    900: '#1c1917',
    800: '#292524',
    700: '#44403c',
    600: '#57534e',
    500: '#78716c',
    400: '#a8a29e',
    300: '#d6d3d1'
  }
}

/**
 * Generate a dark theme from a base color palette
 */
function createBaseTheme(
  id: string,
  name: string,
  description: string,
  colors: typeof tailwindColors.zinc
): Theme {
  return {
    id,
    name,
    description,
    isDark: true,
    colors: {
      background: {
        primary: colors[950],
        secondary: colors[900],
        tertiary: colors[800],
        elevated: colors[900]
      },
      text: {
        primary: colors[300],
        secondary: colors[400],
        tertiary: colors[500],
        inverse: colors[900]
      },
      border: {
        default: colors[800],
        subtle: colors[800] + '80',
        focus: '#f59e0b' // amber-500
      },
      accent: {
        primary: '#f59e0b', // amber-500
        hover: '#ea580c', // orange-600
        active: '#f59e0b',
        subtle: '#f59e0b1a'
      },
      semantic: {
        success: '#34d399', // emerald-400
        successSubtle: '#34d39933',
        error: '#f87171', // red-400
        errorSubtle: '#f8717133',
        warning: '#fbbf24', // amber-400
        warningSubtle: '#fbbf2433',
        info: '#60a5fa', // blue-400
        infoSubtle: '#60a5fa33'
      },
      dataTypes: {
        uuid: '#c084fc', // purple-400
        hex: '#fb923c', // orange-400
        date: '#60a5fa', // blue-400
        json: '#818cf8', // indigo-400
        boolean: {
          true: '#34d399', // emerald-400
          false: '#fbbf24' // amber-400
        }
      },
      special: {
        database: '#fbbf24', // amber-400
        overlay: '#00000099', // black/60
        scrollbar: colors[700],
        scrollbarHover: colors[600]
      }
    }
  }
}

/**
 * Dark Theme (Default)
 * Based on Tailwind Zinc with amber accents
 */
export const darkTheme: Theme = createBaseTheme(
  'dark',
  'Dark',
  'Neutral gray background with amber accents',
  tailwindColors.zinc
)

/**
 * Dark Zinc Theme
 * Neutral gray with minimal tint
 */
export const darkZincTheme: Theme = createBaseTheme(
  'dark-zinc',
  'Dark Zinc',
  'Neutral gray palette',
  tailwindColors.zinc
)

/**
 * Dark Slate Theme
 * Cool gray with blue undertones
 */
export const darkSlateTheme: Theme = createBaseTheme(
  'dark-slate',
  'Dark Slate',
  'Cool gray with blue undertones',
  tailwindColors.slate
)

/**
 * Dark Gray Theme
 * True neutral gray
 */
export const darkGrayTheme: Theme = createBaseTheme(
  'dark-gray',
  'Dark Gray',
  'True neutral gray palette',
  tailwindColors.gray
)

/**
 * Dark Neutral Theme
 * Warm gray with brown undertones
 */
export const darkNeutralTheme: Theme = createBaseTheme(
  'dark-neutral',
  'Dark Neutral',
  'Warm gray with brown undertones',
  tailwindColors.neutral
)

/**
 * Dark Stone Theme
 * Warmer gray with beige undertones
 */
export const darkStoneTheme: Theme = createBaseTheme(
  'dark-stone',
  'Dark Stone',
  'Warm gray with beige undertones',
  tailwindColors.stone
)

/**
 * High Contrast Dark Theme
 * Boosted contrast for accessibility
 */
export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Dark theme with enhanced contrast for better readability',
  isDark: true,
  colors: {
    background: {
      primary: '#000000', // Pure black
      secondary: '#0a0a0a', // Near black
      tertiary: '#1a1a1a', // Lighter
      elevated: '#0a0a0a'
    },
    text: {
      primary: '#ffffff', // Pure white
      secondary: '#e5e5e5', // Bright gray
      tertiary: '#a3a3a3', // Medium gray
      inverse: '#000000'
    },
    border: {
      default: '#525252', // Brighter border for visibility
      subtle: '#404040',
      focus: '#fcd34d' // amber-300 (brighter)
    },
    accent: {
      primary: '#fcd34d', // amber-300 (maximum contrast)
      hover: '#fde68a', // amber-200 (even brighter on hover)
      active: '#fcd34d',
      subtle: '#fcd34d33'
    },
    semantic: {
      success: '#6ee7b7', // emerald-200 (brighter)
      successSubtle: '#6ee7b733',
      error: '#fecaca', // red-200 (brighter)
      errorSubtle: '#fecaca33',
      warning: '#fde68a', // amber-200 (brighter)
      warningSubtle: '#fde68a33',
      info: '#bfdbfe', // blue-200 (brighter)
      infoSubtle: '#bfdbfe33'
    },
    dataTypes: {
      uuid: '#e9d5ff', // purple-200 (brighter)
      hex: '#fed7aa', // orange-200 (brighter)
      date: '#bfdbfe', // blue-200 (brighter)
      json: '#c7d2fe', // indigo-200 (brighter)
      boolean: {
        true: '#6ee7b7', // emerald-200 (brighter)
        false: '#fde68a' // amber-200 (brighter)
      }
    },
    special: {
      database: '#fde68a', // amber-200 (brighter)
      overlay: '#000000cc', // Darker overlay
      scrollbar: '#737373', // Brighter scrollbar
      scrollbarHover: '#a3a3a3' // Even brighter on hover
    }
  }
}

/**
 * Dracula Theme
 * Dark theme with vibrant, saturated colors
 * https://draculatheme.com
 */
export const draculaTheme: Theme = {
  id: 'dracula',
  name: 'Dracula',
  description: 'Dark theme with vibrant, saturated colors',
  author: 'Dracula Theme',
  isDark: true,
  colors: {
    background: {
      primary: '#282a36', // Background
      secondary: '#21222c', // Current Line (darker)
      tertiary: '#343746', // Selection (lighter)
      elevated: '#21222c' // Current Line
    },
    text: {
      primary: '#f8f8f2', // Foreground
      secondary: '#6272a4', // Comment
      tertiary: '#44475a', // Current Line (muted)
      inverse: '#282a36' // Background
    },
    border: {
      default: '#343746', // Selection
      subtle: '#44475a', // Current Line
      focus: '#bd93f9' // Purple
    },
    accent: {
      primary: '#bd93f9', // Purple
      hover: '#ff79c6', // Pink
      active: '#bd93f9', // Purple
      subtle: '#bd93f91a'
    },
    semantic: {
      success: '#50fa7b', // Green
      successSubtle: '#50fa7b33',
      error: '#ff5555', // Red
      errorSubtle: '#ff555533',
      warning: '#f1fa8c', // Yellow
      warningSubtle: '#f1fa8c33',
      info: '#8be9fd', // Cyan
      infoSubtle: '#8be9fd33'
    },
    dataTypes: {
      uuid: '#bd93f9', // Purple
      hex: '#ffb86c', // Orange
      date: '#8be9fd', // Cyan
      json: '#ff79c6', // Pink
      boolean: {
        true: '#50fa7b', // Green
        false: '#f1fa8c' // Yellow
      }
    },
    special: {
      database: '#f1fa8c', // Yellow
      overlay: '#282a3699', // Background/60
      scrollbar: '#44475a', // Current Line
      scrollbarHover: '#6272a4' // Comment
    }
  }
}

/**
 * One Dark Pro Theme
 * Based on Atom's iconic One Dark theme
 * https://github.com/Binaryify/OneDark-Pro
 */
export const oneDarkProTheme: Theme = {
  id: 'one-dark-pro',
  name: 'One Dark Pro',
  description: 'Iconic theme from Atom editor',
  author: 'Binaryify',
  isDark: true,
  colors: {
    background: {
      primary: '#282c34', // Editor background
      secondary: '#21252b', // Sidebar background
      tertiary: '#2c313c', // Lighter element
      elevated: '#21252b' // Sidebar
    },
    text: {
      primary: '#abb2bf', // Default text
      secondary: '#5c6370', // Comments
      tertiary: '#4b5263', // Muted
      inverse: '#282c34' // Background
    },
    border: {
      default: '#2c313c', // Border
      subtle: '#181a1f', // Subtle border
      focus: '#61afef' // Blue
    },
    accent: {
      primary: '#61afef', // Blue
      hover: '#528bff', // Brighter blue
      active: '#61afef', // Blue
      subtle: '#61afef1a'
    },
    semantic: {
      success: '#98c379', // Green
      successSubtle: '#98c37933',
      error: '#e06c75', // Red
      errorSubtle: '#e06c7533',
      warning: '#e5c07b', // Yellow
      warningSubtle: '#e5c07b33',
      info: '#61afef', // Blue
      infoSubtle: '#61afef33'
    },
    dataTypes: {
      uuid: '#c678dd', // Purple
      hex: '#d19a66', // Orange
      date: '#56b6c2', // Cyan
      json: '#61afef', // Blue
      boolean: {
        true: '#98c379', // Green
        false: '#e5c07b' // Yellow
      }
    },
    special: {
      database: '#e5c07b', // Yellow
      overlay: '#282c3499', // Background/60
      scrollbar: '#4b5263', // Muted
      scrollbarHover: '#5c6370' // Comments
    }
  }
}

/**
 * GitHub Dark Theme
 * Official GitHub dark theme
 * https://github.com/primer/github-vscode-theme
 */
export const tokyoNightTheme: Theme = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'A clean dark theme celebrating Tokyo at night',
  author: 'enkia',
  isDark: true,
  colors: {
    background: {
      primary: '#1a1b26', // Background
      secondary: '#16161e', // Background dark
      tertiary: '#24283b', // Background highlight
      elevated: '#16161e' // Background dark
    },
    text: {
      primary: '#c0caf5', // Foreground
      secondary: '#a9b1d6', // Foreground dark
      tertiary: '#565f89', // Comment
      inverse: '#1a1b26' // Background
    },
    border: {
      default: '#24283b', // Background highlight
      subtle: '#292e42', // Border
      focus: '#7aa2f7' // Blue
    },
    accent: {
      primary: '#7aa2f7', // Blue
      hover: '#2ac3de', // Cyan
      active: '#7aa2f7', // Blue
      subtle: '#7aa2f71a'
    },
    semantic: {
      success: '#9ece6a', // Green
      successSubtle: '#9ece6a33',
      error: '#f7768e', // Red
      errorSubtle: '#f7768e33',
      warning: '#e0af68', // Yellow
      warningSubtle: '#e0af6833',
      info: '#7dcfff', // Cyan
      infoSubtle: '#7dcfff33'
    },
    dataTypes: {
      uuid: '#bb9af7', // Purple
      hex: '#ff9e64', // Orange
      date: '#7dcfff', // Cyan
      json: '#7aa2f7', // Blue
      boolean: {
        true: '#9ece6a', // Green
        false: '#e0af68' // Yellow
      }
    },
    special: {
      database: '#e0af68', // Yellow
      overlay: '#1a1b2699', // Overlay
      scrollbar: '#292e42', // Border
      scrollbarHover: '#3b4261' // Border highlight
    }
  }
}

/**
 * All available themes
 * Order: Core themes → Base variants → Popular presets
 */
export const themes: Record<string, Theme> = {
  // Core themes
  dark: darkTheme,
  'high-contrast': highContrastTheme,

  // Base color variants
  'dark-zinc': darkZincTheme,
  'dark-slate': darkSlateTheme,
  'dark-gray': darkGrayTheme,
  'dark-neutral': darkNeutralTheme,
  'dark-stone': darkStoneTheme,

  // Popular presets (alphabetical)
  dracula: draculaTheme,
  'one-dark-pro': oneDarkProTheme,
  'tokyo-night': tokyoNightTheme
}

/**
 * Get theme by ID
 */
export function getTheme(id: string): Theme {
  return themes[id] || darkTheme
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Object.keys(themes)
}

/**
 * Get all themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes)
}
