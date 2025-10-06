import { describe, it, expect, vi } from 'vitest'
import { registerUser } from '../registerService'

describe('registerService', () => {
  it('registerUser retorna datos en 200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: 1, username: 'u', email: 'e', role: 'monitor', is_verified: false }, message: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const res = await registerUser({ username: 'u', email: 'e', password: 'p', password_confirm: 'p', first_name: 'f', last_name: 'l', identification: 'id', phone: 'ph' })
    expect(res.user.username).toBe('u')
  })
})


