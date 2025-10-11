import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach } from 'vitest'
import RoomPanel from '../rooms/RoomPanel'

// Mocks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'e', role: 'admin', is_verified: true, first_name: 'Administrador', last_name: 'Principal' },
    token: 't', isLoading: false, isHydrated: true, login: vi.fn(), logout: vi.fn(), isAuthenticated: true, setAuth: vi.fn()
  }))
}))

vi.mock('../../services/roomService', () => ({
  default: {
    getRooms: vi.fn().mockResolvedValue([{ id: 1, name: 'Sala 1' }])
  }
}))

vi.mock('../../services/roomEntryService', () => ({
  getMyEntries: vi.fn().mockResolvedValue([]),
  getMyActiveEntry: vi.fn().mockResolvedValue({ has_active_entry: false }),
  createEntry: vi.fn().mockResolvedValue({ entry: { id: 10, room: 1 } }),
  exitEntry: vi.fn().mockResolvedValue({ ok: true })
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RoomPanel', () => {
  it('renderiza y muestra select de salas', async () => {
    render(<RoomPanel />)
    await waitFor(() => {
      expect(screen.getByText('¡Bienvenido, Administrador Principal! Selecciona una sala y registra tu entrada.')).toBeInTheDocument()
    })
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})


