import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import Register from '../layout/Register'

describe('Register', () => {
  it('renderiza sin crashear y muestra elementos principales', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    expect(screen.getByRole('heading', { name: /Crear Cuenta/i })).toBeInTheDocument()
    expect(screen.getByText(/Completa tus datos para registrarte/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeInTheDocument()
  })

  it('muestra todos los campos de entrada requeridos', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    // Campos de texto
    expect(screen.getByLabelText(/^Nombre$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Apellido$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Usuario$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Identificación$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Teléfono$/i)).toBeInTheDocument()
    
    // Campos de contraseña
    expect(screen.getByLabelText(/^Contraseña$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Confirmar Contraseña$/i)).toBeInTheDocument()
  })

  it('muestra mensajes de error al enviar formulario vacío', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    const submitButton = screen.getByRole('button', { name: /Crear Cuenta/i })
    fireEvent.click(submitButton)
    
    // Verificar mensajes de error para campos obligatorios
    expect(screen.getByText(/El nombre es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/El apellido es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/El usuario es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/El email es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/La identificación es obligatoria/i)).toBeInTheDocument()
    expect(screen.getByText(/El teléfono es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument()
    expect(screen.getByText(/La confirmación de contraseña es obligatoria/i)).toBeInTheDocument()
  })

  it('toggle "Mostrar contraseña" cambia el tipo de input', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    const passwordInput = screen.getByLabelText(/^Contraseña$/i) as HTMLInputElement
    const toggle = screen.getByRole('checkbox', { name: /Mostrar contraseña/i })
    
    expect(passwordInput.type).toBe('password')
    fireEvent.click(toggle)
    expect(passwordInput.type).toBe('text')
    fireEvent.click(toggle)
    expect(passwordInput.type).toBe('password')
  })

  it('toggle "Mostrar confirmación" cambia el tipo de input de confirmación', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    const confirmPasswordInput = screen.getByLabelText(/^Confirmar Contraseña$/i) as HTMLInputElement
    const toggle = screen.getByRole('checkbox', { name: /Mostrar confirmación/i })
    
    expect(confirmPasswordInput.type).toBe('password')
    fireEvent.click(toggle)
    expect(confirmPasswordInput.type).toBe('text')
    fireEvent.click(toggle)
    expect(confirmPasswordInput.type).toBe('password')
  })

  it('muestra indicadores de requisitos de contraseña al escribir', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    fireEvent.change(passwordInput, { target: { value: 'test' } })
    
    // Verificar que aparecen los indicadores de requisitos
    expect(screen.getByText(/Una mayúscula/i)).toBeInTheDocument()
    expect(screen.getByText(/Una minúscula/i)).toBeInTheDocument()
    expect(screen.getByText(/Un número/i)).toBeInTheDocument()
    expect(screen.getByText(/Un carácter especial/i)).toBeInTheDocument()
  })

  it('muestra enlace para ir al login', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    expect(screen.getByText(/¿Ya tienes cuenta\?/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inicia sesión aquí/i })).toBeInTheDocument()
  })

  it('permite escribir en todos los campos de entrada', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    const testValue = 'test value'
    
    // Probar todos los campos
    const firstNameInput = screen.getByLabelText(/^Nombre$/i)
    fireEvent.change(firstNameInput, { target: { value: testValue } })
    expect(firstNameInput).toHaveValue(testValue)
    
    const lastNameInput = screen.getByLabelText(/^Apellido$/i)
    fireEvent.change(lastNameInput, { target: { value: testValue } })
    expect(lastNameInput).toHaveValue(testValue)
    
    const usernameInput = screen.getByLabelText(/^Usuario$/i)
    fireEvent.change(usernameInput, { target: { value: testValue } })
    expect(usernameInput).toHaveValue(testValue)
    
    const emailInput = screen.getByLabelText(/^Email$/i)
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    expect(emailInput).toHaveValue('test@test.com')
    
    const identificationInput = screen.getByLabelText(/^Identificación$/i)
    fireEvent.change(identificationInput, { target: { value: '123456789' } })
    expect(identificationInput).toHaveValue('123456789')
    
    const phoneInput = screen.getByLabelText(/^Teléfono$/i)
    fireEvent.change(phoneInput, { target: { value: '1234567890' } })
    expect(phoneInput).toHaveValue('1234567890')
    
    const passwordInput = screen.getByLabelText(/^Contraseña$/i)
    fireEvent.change(passwordInput, { target: { value: testValue } })
    expect(passwordInput).toHaveValue(testValue)
    
    const confirmPasswordInput = screen.getByLabelText(/^Confirmar Contraseña$/i)
    fireEvent.change(confirmPasswordInput, { target: { value: testValue } })
    expect(confirmPasswordInput).toHaveValue(testValue)
  })
})
