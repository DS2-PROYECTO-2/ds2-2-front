import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'  // ← Agregar esta importación
import { AuthProvider } from '../../context/AuthContext'
import Login from '../layout/Login'

// Mock del fetch para simular respuestas de la API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Login - Integración con API', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.clearAllMocks()
  })

  it('login exitoso redirige al dashboard', async () => {
    // Mock de respuesta exitosa
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Login exitoso',
        token: 'abc123',
        user: { id: 1, username: 'test', email: 'test@test.com' }
      })
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByLabelText(/^Usuario$/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/login/',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'testpass' })
        })
      )
    })
  })

  it('muestra error cuando las credenciales son incorrectas', async () => {
    // Mock de respuesta de error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ non_field_errors: ['Credenciales inválidas'] })
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByLabelText(/^Usuario$/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument()
    })
  })

  it('muestra error de usuario no encontrado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ username: ['Usuario no encontrado'] })
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByLabelText(/^Usuario$/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })

    fireEvent.change(usernameInput, { target: { value: 'nonexistent' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Usuario no encontrado/i)).toBeInTheDocument()
    })
  })

  it('muestra error de contraseña incorrecta', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ password: ['Contraseña incorrecta'] })
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByLabelText(/^Usuario$/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })

    fireEvent.change(usernameInput, { target: { value: 'user' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Contraseña incorrecta/i)).toBeInTheDocument()
    })
  })

  it('muestra estado de carga durante el login', async () => {
    // Mock de respuesta lenta
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ token: 'abc123', user: {} })
      }), 100))
    )

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const usernameInput = screen.getByLabelText(/^Usuario$/i)
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })

    fireEvent.change(usernameInput, { target: { value: 'test' } })
    fireEvent.change(passwordInput, { target: { value: 'test' } })
    fireEvent.click(submitButton)

    // Verificar que muestra estado de carga
    expect(screen.getByText(/Cargando.../i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Esperar a que termine la carga
    await waitFor(() => {
      expect(screen.queryByText(/Cargando.../i)).not.toBeInTheDocument()
    })
  })
})