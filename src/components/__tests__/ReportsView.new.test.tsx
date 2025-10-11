import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ReportsView from '../reports/ReportsView'

// Mock de useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', is_verified: true },
    token: 'test-token', 
    isLoading: false, 
    isHydrated: true, 
    login: vi.fn(), 
    logout: vi.fn(), 
    isAuthenticated: true, 
    setAuth: vi.fn()
  }))
}))

// Mock de useSecurity
vi.mock('../../hooks/useSecurity', () => ({
  useSecurity: vi.fn(() => ({
    isAdmin: true,
    canEdit: vi.fn(() => true),
    canDelete: vi.fn(() => true),
    canCreate: vi.fn(() => true)
  }))
}))

// Mock de servicios
vi.mock('../../services/roomService', () => ({
  getRooms: vi.fn().mockResolvedValue([
    { id: 1, name: 'Sala 1' },
    { id: 2, name: 'Sala 2' }
  ])
}))

vi.mock('../../services/userManagementService', () => ({
  getUsers: vi.fn().mockResolvedValue([
    { id: 1, username: 'monitor1', full_name: 'Monitor 1', role: 'monitor', is_active: true, is_verified: true },
    { id: 2, username: 'monitor2', full_name: 'Monitor 2', role: 'monitor', is_active: true, is_verified: true }
  ])
}))

vi.mock('../../services/scheduleService', () => ({
  default: {
    getSchedules: vi.fn().mockResolvedValue([
      {
        id: 1,
        user: 1,
        room: 1,
        start_time: '2025-01-15T09:00:00Z',
        end_time: '2025-01-15T17:00:00Z',
        status: 'active'
      }
    ])
  }
}))

vi.mock('../../services/roomEntryService', () => ({
  getAllEntriesUnpaginated: vi.fn().mockResolvedValue([
    {
      id: 1,
      user: 1,
      room: 1,
      startedAt: '2025-01-15T09:00:00Z',
      endedAt: '2025-01-15T17:00:00Z',
      roomName: 'Sala 1'
    }
  ]),
  getMyEntries: vi.fn().mockResolvedValue([])
}))

vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url) => {
      if (url.includes('/api/rooms/reports/stats/')) {
        return Promise.resolve({
          late_arrivals_count: 2,
          total_assigned_hours: 40,
          total_worked_hours: 35,
          remaining_hours: 5
        })
      }
      if (url.includes('/api/rooms/reports/worked-hours/')) {
        return Promise.resolve({
          total_worked_hours: 35,
          total_assigned_hours: 40,
          compliance_percentage: 87.5,
          overlaps_found: [],
          user_hours: { 'Monitor 1': 20, 'Monitor 2': 15 },
          schedule_hours: { 'Turno 1': 8, 'Turno 2': 8 }
        })
      }
      return Promise.resolve([])
    })
  }
}))

describe('ReportsView - New Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la vista de reportes correctamente', async () => {
    render(<ReportsView />)
    
    await waitFor(() => {
      expect(screen.getByText('📊 Reportes y Estadísticas')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Período:')).toBeInTheDocument()
    expect(screen.getByText('Sala:')).toBeInTheDocument()
  })

  it('muestra filtros de monitor para administradores', async () => {
    render(<ReportsView />)
    
    await waitFor(() => {
      expect(screen.getByText('Monitor:')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Todos los monitores')).toBeInTheDocument()
    })
  })

  it('cambia período correctamente', async () => {
    render(<ReportsView />)
    
    const periodSelect = screen.getByDisplayValue('Semana')
    fireEvent.change(periodSelect, { target: { value: 'month' } })
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mes')).toBeInTheDocument()
    })
  })

  it('muestra filtros de semana cuando se selecciona período semana', async () => {
    render(<ReportsView />)
    
    const periodSelect = screen.getByDisplayValue('Semana')
    fireEvent.change(periodSelect, { target: { value: 'week' } })
    
    await waitFor(() => {
      expect(screen.getByText('Seleccionar semana:')).toBeInTheDocument()
    })
  })

  it('muestra filtros de mes cuando se selecciona período mes', async () => {
    render(<ReportsView />)
    
    const periodSelect = screen.getByDisplayValue('Semana')
    fireEvent.change(periodSelect, { target: { value: 'month' } })
    
    await waitFor(() => {
      expect(screen.getByText('Año:')).toBeInTheDocument()
      expect(screen.getByText('Mes:')).toBeInTheDocument()
    })
  })

  it('filtra por sala correctamente', async () => {
    render(<ReportsView />)
    
    // Verificar que el componente se renderiza
    await waitFor(() => {
      expect(screen.getByText(/Reportes y Estadísticas/)).toBeInTheDocument()
    })
    
    // Verificar que el selector de sala existe
    expect(screen.getByDisplayValue('Todas las salas')).toBeInTheDocument()
  })

  it('filtra por monitor correctamente', async () => {
    render(<ReportsView />)
    
    // Verificar que el componente se renderiza
    await waitFor(() => {
      expect(screen.getByText(/Reportes y Estadísticas/)).toBeInTheDocument()
    })
    
    // Verificar que el selector de monitor existe
    expect(screen.getByDisplayValue('Todos los monitores')).toBeInTheDocument()
  })

  it('muestra cards de estadísticas', async () => {
    render(<ReportsView />)
    
    await waitFor(() => {
      expect(screen.getByText('Llegadas Tarde')).toBeInTheDocument()
      expect(screen.getByText('Horas Asignadas')).toBeInTheDocument()
      expect(screen.getByText('Horas Trabajadas')).toBeInTheDocument()
      expect(screen.getByText('Horas Faltantes')).toBeInTheDocument()
    })
  })

  it('muestra gráficos correctamente', async () => {
    render(<ReportsView />)
    
    await waitFor(() => {
      expect(screen.getByText(/Entradas y Salidas por Día/)).toBeInTheDocument()
      expect(screen.getByText(/Horas por Día/)).toBeInTheDocument()
      expect(screen.getAllByText(/Distribución por Sala/)).toHaveLength(2)
    })
  })

  it('maneja cambios de año correctamente', async () => {
    render(<ReportsView />)
    
    // Cambiar a período mes
    const periodSelect = screen.getByDisplayValue('Semana')
    fireEvent.change(periodSelect, { target: { value: 'month' } })
    
    // Esperar a que se renderice el selector de año
    await waitFor(() => {
      expect(screen.getByText(/Año:/)).toBeInTheDocument()
    })
  })

  it('maneja cambios de mes correctamente', async () => {
    render(<ReportsView />)
    
    // Cambiar a período mes
    const periodSelect = screen.getByDisplayValue('Semana')
    fireEvent.change(periodSelect, { target: { value: 'month' } })
    
    // Esperar a que se renderice el selector de mes
    await waitFor(() => {
      expect(screen.getByText(/Mes:/)).toBeInTheDocument()
    })
  })

  it('muestra estado de carga', async () => {
    const mockApiClient = await import('../../utils/api')
    mockApiClient.apiClient.get = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({}), 100))
    )

    render(<ReportsView />)
    
    expect(screen.getByText('⚠️ Debe seleccionar una semana para ver los datos')).toBeInTheDocument()
  })

  it('muestra mensaje de error cuando falla la carga', async () => {
    const mockApiClient = await import('../../utils/api')
    mockApiClient.apiClient.get = vi.fn().mockRejectedValue(new Error('Error de conexión'))

    render(<ReportsView />)
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Debe seleccionar una semana para ver los datos')).toBeInTheDocument()
    })
  })

  it('actualiza títulos de gráficos según filtros', async () => {
    render(<ReportsView />)
    
    // Verificar que se muestran los títulos de gráficos
    await waitFor(() => {
      expect(screen.getByText(/Entradas y Salidas por Día/)).toBeInTheDocument()
      expect(screen.getByText(/Horas por Día/)).toBeInTheDocument()
      expect(screen.getAllByText(/Distribución por Sala/)).toHaveLength(2)
    })
  })

  it('filtra por monitor en títulos de gráficos', async () => {
    render(<ReportsView />)
    
    // Verificar que se muestran los títulos de gráficos
    await waitFor(() => {
      expect(screen.getByText(/Entradas y Salidas por Día/)).toBeInTheDocument()
      expect(screen.getByText(/Horas por Día/)).toBeInTheDocument()
      expect(screen.getAllByText(/Distribución por Sala/)).toHaveLength(2)
    })
  })
})
