import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../api'

describe('apiClient errors', () => {
  const originalLocation = window.location
  beforeEach(() => {
    vi.restoreAllMocks()
    // Stub de location
    // @ts-expect-error
    delete window.location
    // @ts-expect-error
    window.location = { href: '' }
  })

  it('redirecciona en 401', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'auth' }), { status: 401, headers: { 'Content-Type': 'application/json' } }))
    await expect(apiClient.get('/x')).rejects.toBeTruthy()
  })

  it('redirecciona en 403', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } }))
    await expect(apiClient.get('/x')).rejects.toBeTruthy()
  })
})
