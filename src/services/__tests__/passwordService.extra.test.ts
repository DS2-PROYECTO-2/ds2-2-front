import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  sendForgotPasswordEmail,
  validateResetToken,
  confirmPasswordReset,
} from '../passwordService'

describe('passwordService (extra)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = originalFetch
  })

  it('sendForgotPasswordEmail devuelve success en 200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ message: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const res = await sendForgotPasswordEmail({ email: 'a@b.com' })
    expect(res.success).toBe(true)
  })

  it('validateResetToken devuelve success cuando valid=true', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ valid: true, user: { username: 'u', email: 'e' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const res = await validateResetToken('token')
    expect(res.success).toBe(true)
  })

  it('confirmPasswordReset devuelve success en 200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ message: 'changed' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const res = await confirmPasswordReset('t','n','n')
    expect(res.success).toBe(true)
  })
})


