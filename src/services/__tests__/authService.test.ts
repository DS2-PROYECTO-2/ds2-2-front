import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService, type LoginCredentials } from '../authService'
import * as api from '../../utils/api'

interface AuthResponseMock {
  token: string
  user: { id: number; username: string; email: string; role: string; is_verified: boolean }
  message: string
}

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Clear localStorage mock
    vi.mocked(localStorage.getItem).mockClear()
    vi.mocked(localStorage.setItem).mockClear()
    vi.mocked(localStorage.removeItem).mockClear()
    vi.mocked(localStorage.clear).mockClear()
  })

  it('login guarda token y user', async () => {
    const creds: LoginCredentials = { username: 'u', password: 'p' }
    vi.spyOn(api.apiClient, 'post').mockResolvedValueOnce({ token: 't', user: { id: 1, username: 'u', email: 'e', role: 'admin', is_verified: true }, message: 'ok' } as AuthResponseMock)
    const res = await authService.login(creds)
    expect(res.token).toBe('t')
    expect(localStorage.setItem).toHaveBeenCalledWith('authToken', 't')
    expect(localStorage.setItem).toHaveBeenCalledWith('user', expect.stringContaining('"username":"u"'))
  })

  it('logout limpia almacenamiento', () => {
    localStorage.setItem('authToken', 't')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    authService.logout()
    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken')
    expect(localStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('getProfile usa apiClient.get', async () => {
    vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce({ id: 1, username: 'u', email: 'e', role: 'admin', is_verified: true })
    const user = await authService.getProfile()
    expect(user.username).toBe('u')
  })

  it('isAuthenticated depende de token', () => {
    // Mock localStorage to return null initially
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    expect(authService.isAuthenticated()).toBe(false)
    
    // Mock localStorage to return a token
    vi.mocked(localStorage.getItem).mockReturnValue('t')
    expect(authService.isAuthenticated()).toBe(true)
  })
})
