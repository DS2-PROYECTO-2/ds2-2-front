import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'

// Mock global fetch para evitar llamadas reales y 401 en Happy DOM
const originalFetch = globalThis.fetch

beforeAll(() => {
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
    // Por defecto, devolver OK vacío
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
})

afterAll(() => {
  vi.restoreAllMocks()
  globalThis.fetch = originalFetch
})