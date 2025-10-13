import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ProfileView from '../../profile/ProfileView'

// Mock del hook useAuth para inyectar un usuario y evitar llamadas al backend
vi.mock('../../../hooks/useAuth', () => {
  return {
    useAuth: () => ({
      user: {
        id: 1,
        username: 'tester',
        email: 'tester@example.com',
        role: 'monitor',
        is_verified: true,
        first_name: 'Test',
        last_name: 'User',
      },
    }),
  }
})

// Mock ligero de authService por si se llega a invocar en efectos secundarios
vi.mock('../../../services/authService', () => ({
  authService: {
    getProfile: vi.fn().mockResolvedValue({
      id: 1,
      username: 'tester',
      email: 'tester@example.com',
      role: 'monitor',
      is_verified: true,
      first_name: 'Test',
      last_name: 'User',
    }),
  },
}))

describe('ProfileView (smoke)', () => {
  it('renderiza el encabezado Mi Perfil', async () => {
    render(<ProfileView />)
    expect(await screen.findByText(/Mi Perfil/i)).toBeInTheDocument()
  })
})


