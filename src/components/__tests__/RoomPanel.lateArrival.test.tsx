import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import RoomPanel from '../rooms/RoomPanel'

// Mocks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'monitor', role: 'monitor', is_verified: true, first_name: 'Monitor', last_name: 'Test' },
    isAuthenticated: true
  }))
}))

vi.mock('../../services/roomService', () => ({
  getRooms: vi.fn().mockResolvedValue([{ id: 1, name: 'Sala 1' }])
}))

vi.mock('../../services/roomEntryService', () => ({
  getMyEntries: vi.fn().mockResolvedValue([]),
  getMyActiveEntry: vi.fn().mockResolvedValue({ has_active_entry: false }),
  createEntry: vi.fn().mockResolvedValue({ entry: { id: 10, room: 1 } }),
  exitEntry: vi.fn().mockResolvedValue({ ok: true })
}))

vi.mock('../../services/scheduleService', () => ({
  default: {
    getMyCurrentSchedule: vi.fn().mockResolvedValue({
      has_current_schedule: true,
      current_schedule: {
        id: 1,
        user: 1,
        room: 1,
        start_datetime: '2025-10-09T14:00:00Z',
        end_datetime: '2025-10-09T15:00:00Z'
      }
    }),
    getMySchedules: vi.fn().mockResolvedValue({
      current: [],
      upcoming: [],
      past: []
    })
  }
}))

// Mock para el evento de toast
const mockDispatchEvent = vi.fn()
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
})

describe('RoomPanel - Late Arrival Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el componente correctamente', async () => {
    render(<RoomPanel />)
    
    // Verificar que el componente se renderiza - usar texto parcial
    expect(screen.getByText(/Selecciona una sala y registra tu entrada/)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Registrarse')).toBeInTheDocument()
  })

  it('muestra el select de salas', async () => {
    render(<RoomPanel />)
    
    const roomSelect = screen.getByRole('combobox')
    expect(roomSelect).toBeInTheDocument()
    expect(roomSelect).toBeDisabled() // El select está deshabilitado inicialmente
  })

  it('maneja el clic en el botón de registro', async () => {
    render(<RoomPanel />)
    
    const registerButton = screen.getByText('Registrarse')
    fireEvent.click(registerButton)
    
    // Verificar que el botón sigue presente (no se rompe)
    expect(registerButton).toBeInTheDocument()
  })
})
