import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock del authService
vi.mock('../../services/authService', () => ({
  authService: {
    getProfile: vi.fn().mockResolvedValue({ username: 'test', role: 'admin' }),
    logout: vi.fn()
  }
}))

const Dashboard = () => <div>Dashboard Content</div>

describe('ProtectedRoute', () => {
  it('redirige al login cuando no está autenticado', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    )
    
    // Verificar que no muestra el contenido
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('muestra contenido cuando está autenticado', async () => {
    // Configurar localStorage para usuario autenticado
    localStorage.setItem('user', JSON.stringify({ username: 'test' }))
    localStorage.setItem('authToken', 'abc123')

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
    })
  })
})
