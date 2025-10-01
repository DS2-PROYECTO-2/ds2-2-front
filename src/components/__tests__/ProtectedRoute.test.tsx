import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import { ProtectedRoute } from '../ProtectedRoute'

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

  it('muestra contenido cuando está autenticado', () => {
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
    
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })
})
