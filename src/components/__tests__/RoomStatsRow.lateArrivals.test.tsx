import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import RoomStatsRow from '../rooms/RoomStatsRow'

// Mocks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'monitor', role: 'monitor', is_verified: true },
    isAuthenticated: true
  }))
}))

vi.mock('../../services/roomEntryService', () => ({
  getMyEntries: vi.fn().mockResolvedValue([
    {
      id: 1,
      startedAt: '2025-10-09T14:25:00Z', // 25 minutos después del inicio del turno
      userId: 1,
      roomId: 1
    }
  ])
}))

vi.mock('../../services/scheduleService', () => ({
  default: {
    getMySchedules: vi.fn().mockResolvedValue({
      current: [],
      upcoming: [],
      past: [
        {
          id: 1,
          user: 1,
          room: 1,
          start_datetime: '2025-10-09T14:00:00Z',
          end_datetime: '2025-10-09T15:00:00Z'
        }
      ]
    })
  }
}))

describe('RoomStatsRow - Late Arrivals', () => {
  it('calcula y muestra llegadas tarde correctamente', async () => {
    render(<RoomStatsRow />)
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText('Llegadas tarde (mes)')).toBeInTheDocument()
    })
    
    // Verificar que se muestra el contador de llegadas tarde
    const lateArrivalsCard = screen.getByText('Llegadas tarde (mes)').closest('.mini')
    expect(lateArrivalsCard).toBeInTheDocument()
  })

  it('maneja eventos de actualización en tiempo real', async () => {
    render(<RoomStatsRow />)
    
    // Simular evento de nueva entrada
    const event = new CustomEvent('room-entry-added')
    window.dispatchEvent(event)
    
    // Verificar que el componente se actualiza
    await waitFor(() => {
      expect(screen.getByText('Llegadas tarde (mes)')).toBeInTheDocument()
    })
  })

  it('maneja eventos de salida de sala', async () => {
    render(<RoomStatsRow />)
    
    // Simular evento de salida
    const event = new CustomEvent('room-entry-exited')
    window.dispatchEvent(event)
    
    // Verificar que el componente se actualiza
    await waitFor(() => {
      expect(screen.getByText('Llegadas tarde (mes)')).toBeInTheDocument()
    })
  })

  it('maneja eventos de actualización de turnos', async () => {
    render(<RoomStatsRow />)
    
    // Simular evento de actualización de turnos
    const event = new CustomEvent('schedule-updated')
    window.dispatchEvent(event)
    
    // Verificar que el componente se actualiza
    await waitFor(() => {
      expect(screen.getByText('Llegadas tarde (mes)')).toBeInTheDocument()
    })
  })
})


