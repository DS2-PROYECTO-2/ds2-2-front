import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import Register from '../layout/Register'

describe('Register - Validaciones Mejoradas', () => {
  describe('Validación de Email Mejorada', () => {
    it('valida email sin @', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto email
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'sin-arroba' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/El email no es válido/i)).toBeInTheDocument()
      })
    })

    it('valida email sin dominio', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto email
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/El email no es válido/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validación de Contraseña Mejorada', () => {
    it('valida contraseña muy corta', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto contraseña
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: '123' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: '123' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument()
      })
    })

    it('valida contraseña sin mayúscula', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto contraseña
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'password' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'password' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una mayúscula/i)).toBeInTheDocument()
      })
    })

    it('valida contraseña sin minúscula', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto contraseña
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'PASSWORD' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'PASSWORD' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una minúscula/i)).toBeInTheDocument()
      })
    })

    it('valida contraseña sin número', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto contraseña
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una número/i)).toBeInTheDocument()
      })
    })

    it('valida contraseña sin carácter especial', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto contraseña
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una carácter especial/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validación de Identificación Mejorada', () => {
    it('valida identificación muy corta', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto identificación
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '12345' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La identificación debe tener entre 6 y 10 dígitos/i)).toBeInTheDocument()
      })
    })

    it('valida identificación muy larga', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto identificación
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '12345678901' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La identificación debe tener entre 6 y 10 dígitos/i)).toBeInTheDocument()
      })
    })

    it('valida identificación con letras', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto identificación
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: 'abc123' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La identificación debe tener entre 6 y 10 dígitos/i)).toBeInTheDocument()
      })
    })

    it('valida identificación con caracteres especiales', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto identificación
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '12-34' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La identificación debe tener entre 6 y 10 dígitos/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validación de Campos Obligatorios Mejorada', () => {
    it('valida todos los campos obligatorios cuando están vacíos', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument()
        expect(screen.getByText(/El apellido es obligatorio/i)).toBeInTheDocument()
        expect(screen.getByText(/El usuario es obligatorio/i)).toBeInTheDocument()
        expect(screen.getByText(/El email es obligatorio/i)).toBeInTheDocument()
        expect(screen.getByText(/La identificación es obligatoria/i)).toBeInTheDocument()
        expect(screen.getByText(/El teléfono es obligatorio/i)).toBeInTheDocument()
        expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument()
        expect(screen.getByText(/La confirmación de contraseña es obligatoria/i)).toBeInTheDocument()
      })
    })
  })

  describe('Limpieza de Errores Mejorada', () => {
    it('limpia errores al escribir en cualquier campo', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Enviar formulario vacío para generar errores
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument()
      })

      // Escribir en el campo nombre
      const nameInput = screen.getByLabelText(/^Nombre$/i)
      fireEvent.change(nameInput, { target: { value: 'Juan' } })

      // El error debería desaparecer
      await waitFor(() => {
        expect(screen.queryByText(/El nombre es obligatorio/i)).not.toBeInTheDocument()
      })
    })

    it('limpia errores de contraseña al escribir', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Llenar todos los campos excepto contraseña
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }

      await waitFor(() => {
        expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument()
      })

      // Escribir en el campo contraseña
      const passwordInput = screen.getByLabelText(/^Contraseña$/i)
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })

      // El error debería desaparecer
      await waitFor(() => {
        expect(screen.queryByText(/La contraseña es obligatoria/i)).not.toBeInTheDocument()
      })
    })
  })
})
