import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Register from '../layout/Register'

vi.mock('../BackgroundRainParticles', () => ({
  default: () => <div data-testid="bg" />
}))

vi.mock('../../services/registerService', () => ({
  registerUser: vi.fn().mockResolvedValue({ message: 'Cuenta creada', user: { id: 1 } })
}))

describe('Register', () => {
  it('renderiza el formulario y valida campos requeridos', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    // Hay un título y un botón con el mismo texto
    expect(screen.getAllByText('Crear Cuenta').length).toBeGreaterThan(0)
    // Envío sin completar campos muestra errores
    const submit = screen.getByRole('button', { name: 'Crear Cuenta' })
    fireEvent.click(submit)

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    })
  })
})


