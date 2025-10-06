import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { RequireRoles, RequireVerified } from '../auth/RouteGuards'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'e', role: 'admin', is_verified: true },
    token: 't', isLoading: false, isHydrated: true, login: vi.fn(), logout: vi.fn(), isAuthenticated: true, setAuth: vi.fn()
  }))
}))

describe('RouteGuards', () => {
  it('RequireRoles permite acceso a admin', () => {
    const { container } = render(
      <BrowserRouter>
        <RequireRoles roles={['admin']}> <div id="ok" /> </RequireRoles>
      </BrowserRouter>
    )
    expect(container.querySelector('#ok')).not.toBeNull()
  })

  it('RequireVerified permite acceso a verificados', () => {
    const { container } = render(
      <BrowserRouter>
        <RequireVerified> <div id="ok" /> </RequireVerified>
      </BrowserRouter>
    )
    expect(container.querySelector('#ok')).not.toBeNull()
  })
})


