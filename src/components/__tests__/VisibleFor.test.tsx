import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { VisibleFor } from '../auth/VisibleFor'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'e', role: 'admin', is_verified: true },
    token: 't', isLoading: false, isHydrated: true, login: vi.fn(), logout: vi.fn(), isAuthenticated: true, setAuth: vi.fn()
  }))
}))

describe('VisibleFor', () => {
  it('muestra children para rol permitido', () => {
    render(<VisibleFor roles={['admin']}><div>OK</div></VisibleFor>)
    expect(screen.getByText('OK')).toBeInTheDocument()
  })
})


