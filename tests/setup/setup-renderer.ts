import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { mockWindowApi } from '../mocks/ipc.mock'

// @ts-expect-error - Mocking global window object
global.window = {
  ...global.window,
  api: mockWindowApi
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string): string | null => {
      return store[key] || null
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString()
    },
    removeItem: (key: string): void => {
      delete store[key]
    },
    clear: (): void => {
      store = {}
    }
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Console setup for cleaner test output
global.console = {
  ...console,
  log: vi.fn(), // Suppress logs during tests
  warn: vi.fn(), // Suppress warnings during tests
  error: console.error // Keep errors visible
}
