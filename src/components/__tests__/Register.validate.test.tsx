import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import Register from '../layout/Register'

describe('Register - Validaciones', () => {
  describe('Validación de Email', () => {
    it('muestra error para email sin @', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      // Llenar todos los campos con datos válidos excepto email
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'sin-arroba' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

      // Enviar formulario
      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(screen.getByText(/El email no es válido/i)).toBeInTheDocument()
      })
    })

    it('muestra error para email sin dominio', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
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

  describe('Validación de Contraseña', () => {
    it('muestra error para contraseña muy corta', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
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

    it('muestra error para contraseña sin mayúscula', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'password123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'password123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una mayúscula/i)).toBeInTheDocument()
      })
    })

    it('muestra error para contraseña sin minúscula', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'PASSWORD123!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'PASSWORD123!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una minúscula/i)).toBeInTheDocument()
      })
    })

    it('muestra error para contraseña sin número', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
      fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
      fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
      fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password!' } })
      fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password!' } })

      const form = document.querySelector('form')
      if (form) {
        fireEvent.submit(form)
      }
      
      await waitFor(() => {
        expect(screen.getByText(/La contraseña debe contener al menos una número/i)).toBeInTheDocument()
      })
    })

    it('muestra error para contraseña sin carácter especial', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
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

  describe('Validación de Confirmación de Contraseña', () => {
    it('muestra error cuando las contraseñas no coinciden', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
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

  describe('Validación de Identificación', () => {
    it('muestra error para identificación muy corta', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
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

    it('muestra error para identificación muy larga', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'usuario_nuevo' } })
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
  })

  describe('Validación de Username Existente', () => {
    it('muestra error para username ya existente', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
      fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
      fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'admin' } }) // Username existente
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
        expect(screen.getByText(/Este nombre de usuario ya está en uso/i)).toBeInTheDocument()
      })
    })
  })

  describe('Indicadores de Requisitos de Contraseña', () => {
    it('muestra indicadores correctos para contraseña válida', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      const passwordInput = screen.getByLabelText(/^Contraseña$/i)
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } })
      
      // Verificar que todos los requisitos se marcan como válidos
      const requirements = screen.getAllByText(/Una mayúscula|Una minúscula|Un número|Un carácter especial/i)
      requirements.forEach(requirement => {
        expect(requirement).toHaveClass('valid')
      })
    })

    it('muestra indicadores incorrectos para contraseña inválida', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )
      
      const passwordInput = screen.getByLabelText(/^Contraseña$/i)
      fireEvent.change(passwordInput, { target: { value: 'password' } })
      
      // Verificar que los requisitos se marcan correctamente
      // "password" tiene minúsculas pero no mayúsculas, números ni caracteres especiales
      expect(screen.getByText(/Una minúscula/i)).toHaveClass('valid')
      expect(screen.getByText(/Una mayúscula/i)).toHaveClass('invalid')
      expect(screen.getByText(/Un número/i)).toHaveClass('invalid')
      expect(screen.getByText(/Un carácter especial/i)).toHaveClass('invalid')
    })
  })

  describe('Limpieza de Errores', () => {
    it('limpia errores al escribir en el campo', async () => {
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
  })
})