import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../layout/Login'

describe('Login – validación y envío', () => {
  it('limpia el error de usuario al escribir luego de enviar vacío (revalida en submit)', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const submit = screen.getByRole('button', { name: /Iniciar Sesión/i })
    fireEvent.click(submit)
    expect(screen.getByText(/El usuario es obligatorio/i)).toBeInTheDocument()

    const user = screen.getByLabelText(/^Usuario$/i)
    fireEvent.change(user, { target: { value: 'jane' } })

    // Revalida
    fireEvent.click(submit)

    expect(screen.queryByText(/El usuario es obligatorio/i)).toBeNull()
  })
})