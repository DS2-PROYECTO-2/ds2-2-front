import { describe, it, expect, vi } from 'vitest'
import { sendForgotPasswordEmail, validateResetToken, confirmPasswordReset } from '../passwordService'

describe('passwordService errors', () => {
  it('sendForgotPasswordEmail maneja error detalle', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'bad' }), { status: 400, headers: { 'Content-Type': 'application/json' } }))
    const res = await sendForgotPasswordEmail({ email: 'a@b.com' })
    expect(res.success).toBe(false)
  })

  it('validateResetToken maneja token inválido', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ valid: false, error: 'invalid' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const res = await validateResetToken('x')
    expect(res.success).toBe(false)
  })

  it('confirmPasswordReset maneja error con mensaje', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ message: 'fail' }), { status: 400, headers: { 'Content-Type': 'application/json' } }))
    const res = await confirmPasswordReset('t','n','m')
    expect(res.success).toBe(false)
  })
})
