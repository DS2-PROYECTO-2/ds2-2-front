import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RoomPanel from '../rooms/RoomPanel'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'e', role: 'admin', is_verified: true },
    token: 't', isLoading: false, isHydrated: true, login: vi.fn(), logout: vi.fn(), isAuthenticated: true, setAuth: vi.fn()
  }))
}))

const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

vi.mock('../../services/roomService', () => ({
  fetchRooms: vi.fn().mockResolvedValue([{ id: 1, name: 'Sala 1' }])
}))

vi.mock('../../services/roomEntryService', () => ({
  getMyEntries: vi.fn().mockResolvedValue([]),
  getMyActiveEntry: vi.fn().mockResolvedValue({ has_active_entry: false }),
  createEntry: vi.fn().mockResolvedValue({ entry: { id: 10, room: 1 } }),
  exitEntry: vi.fn().mockResolvedValue({ ok: true })
}))

describe('RoomPanel register', () => {
  it('registra entrada y emite evento', async () => {
    render(<RoomPanel />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled()
    })
  })
})


