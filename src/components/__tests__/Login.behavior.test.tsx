import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../layout/Login'

describe('Login', () => {
  it('renderiza sin crashear y muestra CTA', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument()
  })

  it('muestra mensajes de requerido al enviar vacío', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )
    fireEvent.click(screen.getByText(/Iniciar Sesión/i))
    expect(screen.getByText(/El usuario es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument()
  })

  it('toggle "Mostrar contraseña" cambia el tipo', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
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
})