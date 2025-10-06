import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService, type LoginCredentials } from '../authService'
import * as api from '../../utils/api'

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('login guarda token y user', async () => {
    const creds: LoginCredentials = { username: 'u', password: 'p' }
    vi.spyOn(api.apiClient, 'post').mockResolvedValueOnce({ token: 't', user: { id: 1, username: 'u', email: 'e', role: 'admin', is_verified: true }, message: 'ok' } as any)
    const res = await authService.login(creds)
    expect(res.token).toBe('t')
    expect(localStorage.getItem('authToken')).toBe('t')
    expect(localStorage.getItem('user')).toContain('"username":"u"')
  })

  it('logout limpia almacenamiento', () => {
    localStorage.setItem('authToken', 't')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    authService.logout()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('getProfile usa apiClient.get', async () => {
    vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce({ id: 1, username: 'u', email: 'e', role: 'admin', is_verified: true } as any)
    const user = await authService.getProfile()
    expect(user.username).toBe('u')
  })

  it('isAuthenticated depende de token', () => {
    expect(authService.isAuthenticated()).toBe(false)
    localStorage.setItem('authToken', 't')
    expect(authService.isAuthenticated()).toBe(true)
  })
})
