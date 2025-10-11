import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'authToken') return localStorageMock._authToken || null
    if (key === 'user') return localStorageMock._user || null
    return null
  }),
  setItem: vi.fn((key: string, value: string) => {
    // Store in memory for tests
    if (key === 'authToken') localStorageMock._authToken = value
    if (key === 'user') localStorageMock._user = value
  }),
  removeItem: vi.fn((key: string) => {
    if (key === 'authToken') delete localStorageMock._authToken
    if (key === 'user') delete localStorageMock._user
  }),
  clear: vi.fn(() => {
    delete localStorageMock._authToken
    delete localStorageMock._user
  }),
  length: 0,
  key: vi.fn(),
  _authToken: null,
  _user: null
}

// Reset localStorage mock before each test
beforeAll(() => {
  localStorageMock._authToken = null
  localStorageMock._user = null
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})

// Mock window
const windowMock = {
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  localStorage: localStorageMock,
  location: { href: 'http://localhost:3000' },
  history: { pushState: vi.fn(), replaceState: vi.fn() }
}

// Set up global mocks
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: windowMock,
  writable: true
})

// Mock globalThis for Node.js environment
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(globalThis, 'window', {
  value: windowMock,
  writable: true
})

// Mock localStorage and window at the module level
vi.mock('localStorage', () => localStorageMock)
vi.mock('window', () => windowMock)

// Mock the specific modules that use localStorage and window
vi.mock('../utils/api', async () => {
  const actual = await vi.importActual('../utils/api')
  return {
    ...actual,
    getAuthHeaders: vi.fn().mockReturnValue({
      'Content-Type': 'application/json',
      'Authorization': 'Token test-token'
    })
  }
})

// Mock global fetch para evitar llamadas reales y 401 en Happy DOM
const originalFetch = globalThis.fetch

beforeAll(() => {
  // Mock fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    // Respuestas mínimas para endpoints usados en tests/cobertura
    if (url.includes('/api/notifications/unread-count/')) {
      return new Response(JSON.stringify({ unread_count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/api/notifications/list/')) {
      return new Response(JSON.stringify({ notifications: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/api/rooms/entries/')) {
      return new Response(JSON.stringify({ entries: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/api/rooms/my-entries/')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/api/rooms/my-active-entry/')) {
      return new Response(JSON.stringify({ has_active_entry: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/api/schedule/schedules/')) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/api/rooms/reports/')) {
      return new Response(JSON.stringify({ 
        late_arrivals_count: 0,
        total_assigned_hours: 0,
        total_worked_hours: 0,
        remaining_hours: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Por defecto, devolver OK vacío
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  vi.restoreAllMocks()
  globalThis.fetch = originalFetch
})