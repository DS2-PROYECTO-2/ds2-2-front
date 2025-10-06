import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../api'

describe('apiClient errors', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Stub de location
    // @ts-expect-error Borramos location para poder stubear en entorno de tests
    delete window.location
    // @ts-expect-error Stub de location.href para verificar redirecciones
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
