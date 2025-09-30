import { render, screen, fireEvent } from '@testing-library/react'
import Login from '../layout/Login'

describe('Login', () => {
  it('renderiza sin crashear y muestra CTA', () => {
    render(<Login />)
    expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument()
  })

  it('muestra mensajes de requerido al enviar vacío', () => {
    render(<Login />)
    fireEvent.click(screen.getByText(/Iniciar Sesión/i))
    expect(screen.getByText(/El usuario es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument()
  })

  it('toggle “Mostrar contraseña” cambia el tipo', () => {
    render(<Login />)
    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement
    const toggle = screen.getByLabelText(/Mostrar contraseña/i)
    expect(passwordInput.type).toBe('password')
    fireEvent.click(toggle)
    expect(passwordInput.type).toBe('text')
  })
})