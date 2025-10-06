import { describe, it, expect, vi } from 'vitest'
import { apiClient } from '../api'

describe('apiClient', () => {
  it('get maneja 200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const res = await apiClient.get<{ ok: boolean }>('/x')
    expect(res.ok).toBe(true)
  })

  it('patch opcional sin body', async () => {
    const spy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await apiClient.patch('/y')
    expect(spy).toHaveBeenCalled()
  })
})


