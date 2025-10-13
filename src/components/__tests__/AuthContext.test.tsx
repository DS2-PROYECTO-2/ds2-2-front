import { render, screen, fireEvent, waitFor} from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'  // ← Agregar esta importación
import { AuthProvider } from '../../context/AuthProvider'
import { useAuth } from '../../hooks/useAuth'

// Mock del authService
vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn().mockResolvedValue({ username: 'testuser', role: 'admin' }),
    login: vi.fn().mockResolvedValue({ token: 'test-token', user: { username: 'testuser', role: 'admin' } }),
    logout: vi.fn().mockImplementation(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    })
  }
}))

// Componente de prueba que usa el contexto
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button onClick={() => login({ username: 'test', password: 'test' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('inicializa sin usuario autenticado', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('mantiene usuario autenticado al recargar', async () => {
    localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))
    localStorage.setItem('authToken', 'abc123')

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })
  })

  it('limpia datos al hacer logout', async () => {
    localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))
    localStorage.setItem('authToken', 'abc123')

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })
    
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('authToken')).toBeNull()
  })
})