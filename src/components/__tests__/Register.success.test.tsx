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

describe('Register (success)', () => {
  it('envía formulario válido y muestra modal de éxito', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Juan' } })
    fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } })
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'juan' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'juan@test.com' } })
    fireEvent.change(screen.getByLabelText('Identificación'), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '5555555' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Aa1!aa' } })
    fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), { target: { value: 'Aa1!aa' } })

    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }))

    await waitFor(() => {
      expect(screen.getByText('¡Registro Exitoso!')).toBeInTheDocument()
    })
  })
})


