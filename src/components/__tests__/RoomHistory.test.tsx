import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RoomHistory from '../rooms/RoomHistory'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'e', role: 'admin', is_verified: true },
    token: 't', isLoading: false, isHydrated: true, login: vi.fn(), logout: vi.fn(), isAuthenticated: true, setAuth: vi.fn()
  }))
}))

vi.mock('../../services/roomService', () => ({
  getRooms: vi.fn().mockResolvedValue([{ id: 1, name: 'Sala 1' }])
}))

vi.mock('../../services/roomEntryService', () => ({
  getAllEntries: vi.fn().mockResolvedValue([]),
  getMyEntries: vi.fn().mockResolvedValue([])
}))

describe('RoomHistory', () => {
  it('renderiza y muestra encabezado', async () => {
    render(<RoomHistory />)
    await waitFor(() => {
      expect(screen.getByText('Historial de entradas y salidas')).toBeInTheDocument()
    })
    expect(screen.getByText('Borrar filtros')).toBeInTheDocument()
  })
})


