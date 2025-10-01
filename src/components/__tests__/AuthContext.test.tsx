import { render, screen, fireEvent} from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'  // ← Agregar esta importación
import { AuthProvider } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth'

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

  it('mantiene usuario autenticado al recargar', () => {
    localStorage.setItem('user', JSON.stringify({ username: 'testuser' }))
    localStorage.setItem('authToken', 'abc123')

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
  })

  it('limpia datos al hacer logout', () => {
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

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('authToken')).toBeNull()
  })
})