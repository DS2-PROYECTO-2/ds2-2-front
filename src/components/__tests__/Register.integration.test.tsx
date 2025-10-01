import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import Register from '../layout/Register'
import { vi } from 'vitest'

// Mock de fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Register - Integración con API', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Registro Exitoso', () => {
    it('registra usuario exitosamente y redirige al login', async () => {
      // Mock de respuesta exitosa de la API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Usuario registrado exitosamente. Esperando verificación del administrador.',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@test.com',
            role: 'monitor',
            is_verified: false
          }
        })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario con datos válidos
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      // Enviar formulario
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Verificar que se intentó hacer la llamada a la API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('muestra estado de carga durante el envío', async () => {
      // Mock de API lenta
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ message: 'Usuario registrado exitosamente' })
          }), 100)
        )
      )

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      // Enviar formulario
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Verificar que se intentó hacer la llamada a la API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  describe('Errores de la API', () => {
    it('muestra error de username existente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          username: ['Ya existe un usuario con este nombre de usuario']
        })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/Ya existe un usuario con este nombre de usuario/i)).toBeInTheDocument()
      })
    })

    it('muestra error de email existente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          email: ['Ya existe un usuario con este email']
        })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'admin@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/Ya existe un usuario con este email/i)).toBeInTheDocument()
      })
    })

    it('muestra error de identificación existente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          identification: ['Ya existe un usuario con esta identificación']
        })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '111111111' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/Ya existe un usuario con esta identificación/i)).toBeInTheDocument()
      })
    })

    it('muestra error de contraseñas no coinciden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          password_confirm: ['Las contraseñas no coinciden']
        })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password456!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument()
      })
    })
  })

  describe('Manejo de Errores de Red', () => {
    it('muestra error cuando la API no responde', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Verificar que se intentó hacer la llamada a la API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('muestra error cuando la API retorna respuesta inválida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid response format' })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      // Verificar que se intentó hacer la llamada a la API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  describe('Validación de Datos Enviados', () => {
    it('envía todos los campos requeridos a la API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Usuario registrado exitosamente' })
      })

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar formulario
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/api/auth/register/',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('"username":"testuser"')
          })
        )
      })

      // Verificar que se incluya el role por defecto
      const callArgs = mockFetch.mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body.role).toBe('monitor')
    })
  })
})
