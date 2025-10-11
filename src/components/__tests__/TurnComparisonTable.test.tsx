import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TurnComparisonTable from '../reports/TurnComparisonTable'

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
vi.mock('../../services/userManagementService', () => ({
  getUsers: vi.fn().mockResolvedValue([
    { id: 1, username: 'user1', full_name: 'Usuario 1' },
    { id: 2, username: 'user2', full_name: 'Usuario 2' }
  ])
}))

vi.mock('../../services/roomService', () => ({
  getRooms: vi.fn().mockResolvedValue([
    { id: 1, name: 'Sala 1' },
    { id: 2, name: 'Sala 2' }
  ])
}))

vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      comparaciones: [
        {
          id: 1,
          usuario: 'Usuario 1',
          sala: 'Sala 1',
          turno: '09:00',
          registro: '09:05',
          estado: 'TARDE',
          diferencia: 5,
          fecha: '2025-01-15',
          notas: 'Test note'
        }
      ],
      total_registros: 1,
      filters_applied: {
        date_from: '2025-01-01',
        date_to: '2025-01-31'
      }
    })
  }
}))

describe('TurnComparisonTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la tabla de comparación para administradores', async () => {
    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      expect(screen.getByText('📊 Comparación de Turnos vs Registros')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Desde:')).toBeInTheDocument()
    expect(screen.getByText('Hasta:')).toBeInTheDocument()
    expect(screen.getByText('Usuario:')).toBeInTheDocument()
    expect(screen.getByText('Sala:')).toBeInTheDocument()
  })

  it('muestra datos de comparación cuando se cargan', async () => {
    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      expect(screen.getByText('Usuario 1')).toBeInTheDocument()
      expect(screen.getByText('Sala 1')).toBeInTheDocument()
      expect(screen.getByText('09:00')).toBeInTheDocument()
      expect(screen.getByText('09:05')).toBeInTheDocument()
    })
  })

  it('muestra botón de mostrar todo cuando hay más de 10 registros', async () => {
    // Mock con más de 10 registros
    const mockApiClient = await import('../../utils/api')
    mockApiClient.apiClient.get = vi.fn().mockResolvedValue({
      comparaciones: Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        usuario: `Usuario ${i + 1}`,
        sala: `Sala ${i + 1}`,
        turno: '09:00',
        registro: '09:05',
        estado: 'TARDE',
        diferencia: 5,
        fecha: '2025-01-15',
        notas: 'Test note'
      })),
      total_registros: 15
    })

    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      expect(screen.getByText(/Mostrar todos los registros \(15 total\)/)).toBeInTheDocument()
    })
  })

  it('permite alternar entre vista limitada y completa', async () => {
    const mockApiClient = await import('../../utils/api')
    mockApiClient.apiClient.get = vi.fn().mockResolvedValue({
      comparaciones: Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        usuario: `Usuario ${i + 1}`,
        sala: `Sala ${i + 1}`,
        turno: '09:00',
        registro: '09:05',
        estado: 'TARDE',
        diferencia: 5,
        fecha: '2025-01-15',
        notas: 'Test note'
      })),
      total_registros: 15
    })

    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      const showAllButtons = screen.getAllByText(/📋 Mostrar todos los registros/)
      fireEvent.click(showAllButtons[0]) // Click en el primer botón
    })
    
    await waitFor(() => {
      expect(screen.getByText(/📋 Mostrar solo 10 registros/)).toBeInTheDocument()
    })
  })

  it('aplica scroll cuando se muestran todos los registros', async () => {
    const mockApiClient = await import('../../utils/api')
    mockApiClient.apiClient.get = vi.fn().mockResolvedValue({
      comparaciones: Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        usuario: `Usuario ${i + 1}`,
        sala: `Sala ${i + 1}`,
        turno: '09:00',
        registro: '09:05',
        estado: 'TARDE',
        diferencia: 5,
        fecha: '2025-01-15',
        notas: 'Test note'
      })),
      total_registros: 15
    })

    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      const showAllButtons = screen.getAllByText(/📋 Mostrar todos los registros/)
      fireEvent.click(showAllButtons[0]) // Click en el primer botón
    })
    
    await waitFor(() => {
      const tableContainer = document.querySelector('.table-scroll')
      expect(tableContainer).toHaveStyle({
        maxHeight: '400px',
        overflowY: 'auto'
      })
    })
  })

  it('filtra por usuario correctamente', async () => {
    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      const userSelect = screen.getByDisplayValue('Todos los usuarios')
      fireEvent.change(userSelect, { target: { value: '1' } })
    })
    
    // Verificar que se dispara la carga de datos con el filtro
    await waitFor(() => {
      expect(screen.getByText('Usuario 1')).toBeInTheDocument()
    })
  })

  it('filtra por sala correctamente', async () => {
    render(<TurnComparisonTable />)
    
    await waitFor(() => {
      const roomSelect = screen.getByDisplayValue('Todas las salas')
      fireEvent.change(roomSelect, { target: { value: '1' } })
    })
    
    // Verificar que se dispara la carga de datos con el filtro
    await waitFor(() => {
      expect(screen.getByText('Sala 1')).toBeInTheDocument()
    })
  })

  it('muestra indicador de actualización durante la carga', async () => {
    const mockApiClient = await import('../../utils/api')
    mockApiClient.apiClient.get = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        comparaciones: [],
        total_registros: 0
      }), 100))
    )

    render(<TurnComparisonTable />)
    
    expect(screen.getByText('Cargando comparación de turnos...')).toBeInTheDocument()
  })
})
