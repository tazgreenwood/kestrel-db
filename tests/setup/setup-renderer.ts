import { vi } from 'vitest'
import '@testing-library/jest-dom'
import { mockWindowApi } from '../mocks/ipc.mock'

// Declare global types for test environment
declare global {
  var localStorage: Storage
  interface Window {
    api: typeof mockWindowApi
  }
}

// Setup window.api and globals at module load time
// Happy-dom should have created window by now
if (typeof window !== 'undefined' && window.localStorage) {
  // Add our mock API to window
  window.api = mockWindowApi

  // Make window and localStorage available globally
  // @ts-expect-error - Adding to global scope
  globalThis.window = window
  // @ts-expect-error - Adding to global scope
  globalThis.localStorage = window.localStorage

  // Mock matchMedia for responsive tests
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
}

// Console setup for cleaner test output
global.console = {
  ...console,
  log: vi.fn(), // Suppress logs during tests
  warn: vi.fn(), // Suppress warnings during tests
  error: console.error // Keep errors visible
}
