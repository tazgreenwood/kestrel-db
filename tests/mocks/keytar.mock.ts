import { vi } from 'vitest'

/**
 * Mock keytar for secure credential storage tests
 */
export const mockKeytar = {
  setPassword: vi.fn().mockResolvedValue(undefined),
  getPassword: vi.fn().mockResolvedValue('mock-password'),
  deletePassword: vi.fn().mockResolvedValue(true),
  findCredentials: vi.fn().mockResolvedValue([])
}

/**
 * Helper to set up keytar to return specific password
 */
export function mockKeytarPassword(
  service: string,
  account: string,
  password: string | null
): void {
  mockKeytar.getPassword.mockImplementation((s: string, a: string) => {
    if (s === service && a === account) {
      return Promise.resolve(password)
    }
    return Promise.resolve(null)
  })
}

/**
 * Helper to simulate keytar error
 */
export function mockKeytarError(method: keyof typeof mockKeytar, error: Error): void {
  mockKeytar[method].mockRejectedValue(error)
}

/**
 * Reset all keytar mocks
 */
export function resetKeytarMocks(): void {
  Object.values(mockKeytar).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear()
    }
  })
  // Restore default implementations
  mockKeytar.setPassword.mockResolvedValue(undefined)
  mockKeytar.getPassword.mockResolvedValue('mock-password')
  mockKeytar.deletePassword.mockResolvedValue(true)
  mockKeytar.findCredentials.mockResolvedValue([])
}
