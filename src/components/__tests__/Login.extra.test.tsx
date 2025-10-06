import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Login from '../layout/Login'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn().mockResolvedValue(undefined),
    isLoading: false
  }))
}))

vi.mock('../BackgroundRainParticles', () => ({
  default: () => <div data-testid="bg" />
}))

describe('Login (extra)', () => {
  it('renderiza y permite escribir en campos', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    const user = screen.getByLabelText('Usuario') as HTMLInputElement
    const pass = screen.getByLabelText('Contraseña') as HTMLInputElement
    fireEvent.change(user, { target: { value: 'u' } })
    fireEvent.change(pass, { target: { value: 'p' } })
    expect(user.value).toBe('u')
    expect(pass.value).toBe('p')
  })
})


