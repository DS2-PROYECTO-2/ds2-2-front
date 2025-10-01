import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthProvider'
import Register from '../layout/Register'


describe('Register - Envío de formulario', () => {
  it('valida formato de email', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </BrowserRouter>
    )
    
    // Llenar TODOS los campos incluyendo email inválido desde el inicio
    fireEvent.change(screen.getByLabelText(/^Nombre$/i), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByLabelText(/^Apellido$/i), { target: { value: 'Pérez' } })
    fireEvent.change(screen.getByLabelText(/^Usuario$/i), { target: { value: 'juanperez' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'sin-arroba' } }) // Email inválido desde el inicio
    fireEvent.change(screen.getByLabelText(/^Identificación$/i), { target: { value: '123456789' } })
    fireEvent.change(screen.getByLabelText(/^Teléfono$/i), { target: { value: '1234567890' } })
    fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'Password123!' } })
    fireEvent.change(screen.getByLabelText(/^Confirmar Contraseña$/i), { target: { value: 'Password123!' } })

    // Enviar el formulario para activar la validación nativa
    const form = document.querySelector('form')
    if (form) {
      fireEvent.submit(form)
    }
    
    // Verificar mensaje de error personalizado del componente
    await waitFor(() => {
      expect(screen.getByText(/El email no es válido/i)).toBeInTheDocument()
    })
  })
})