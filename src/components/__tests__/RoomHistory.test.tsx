import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
  getMyEntries: vi.fn().mockResolvedValue([]),
  getAllEntriesUnpaginated: vi.fn().mockResolvedValue([
    {
      id: 1,
      roomId: 1,
      startedAt: '2025-01-15T09:00:00Z',
      endedAt: '2025-01-15T17:00:00Z',
      userName: 'Usuario Test',
      userUsername: 'usuario',
      userDocument: '12345678'
    },
    {
      id: 2,
      roomId: 1,
      startedAt: '2025-01-15T10:00:00Z',
      endedAt: null,
      userName: 'Usuario Test 2',
      userUsername: 'usuario2',
      userDocument: '87654321'
    }
  ])
}))

describe('RoomHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza y muestra encabezado', async () => {
    render(<RoomHistory />)
    await waitFor(() => {
      expect(screen.getByText('Historial de entradas y salidas')).toBeInTheDocument()
    })
    expect(screen.getByText('Borrar filtros')).toBeInTheDocument()
  })

  it('muestra botón de mostrar todo cuando hay registros', async () => {
    render(<RoomHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('📋 Mostrar todo el historial')).toBeInTheDocument()
    })
  })

  it('limita a 10 registros por defecto', async () => {
    // Mock con más de 10 registros
    const mockService = await import('../../services/roomEntryService')
    mockService.getAllEntriesUnpaginated = vi.fn().mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        roomId: 1,
        startedAt: `2025-01-15T${String(i + 9).padStart(2, '0')}:00:00Z`,
        endedAt: `2025-01-15T${String(i + 17).padStart(2, '0')}:00:00Z`,
        roomName: 'Sala Test'
      }))
    )

    render(<RoomHistory />)
    
    await waitFor(() => {
      // Solo debe mostrar 10 registros inicialmente
      const rows = document.querySelectorAll('tbody tr')
      expect(rows.length).toBe(10)
    })
  })

  it('permite alternar entre vista limitada y completa', async () => {
    const mockService = await import('../../services/roomEntryService')
    mockService.getAllEntriesUnpaginated = vi.fn().mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        roomId: 1,
        startedAt: `2025-01-15T${String(i + 9).padStart(2, '0')}:00:00Z`,
        endedAt: `2025-01-15T${String(i + 17).padStart(2, '0')}:00:00Z`,
        roomName: 'Sala Test'
      }))
    )

    render(<RoomHistory />)
    
    await waitFor(() => {
      const showAllButton = screen.getByText('📋 Mostrar todo el historial')
      fireEvent.click(showAllButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('📋 Mostrar solo 10 registros')).toBeInTheDocument()
    })
  })

  it('aplica scroll cuando se muestran todos los registros', async () => {
    const mockService = await import('../../services/roomEntryService')
    mockService.getAllEntriesUnpaginated = vi.fn().mockResolvedValue(
      Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        roomId: 1,
        startedAt: `2025-01-15T${String(i + 9).padStart(2, '0')}:00:00Z`,
        endedAt: `2025-01-15T${String(i + 17).padStart(2, '0')}:00:00Z`,
        roomName: 'Sala Test'
      }))
    )

    render(<RoomHistory />)
    
    await waitFor(() => {
      const showAllButton = screen.getByText('📋 Mostrar todo el historial')
      fireEvent.click(showAllButton)
    })
    
    await waitFor(() => {
      const tableContainer = document.querySelector('.table-scroll')
      expect(tableContainer).toHaveStyle({
        maxHeight: '400px',
        overflowY: 'auto'
      })
    })
  })

  it('filtra por sala correctamente', async () => {
    render(<RoomHistory />)
    
    await waitFor(() => {
      const roomSelect = screen.getByDisplayValue('Todas las salas')
      fireEvent.change(roomSelect, { target: { value: '1' } })
    })
    
    // Verificar que se aplica el filtro
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    })
  })

  it('filtra por usuario correctamente', async () => {
    render(<RoomHistory />)
    
    await waitFor(() => {
      const userInput = screen.getByPlaceholderText('Nombre de usuario')
      fireEvent.change(userInput, { target: { value: 'test' } })
    })
    
    // Verificar que se aplica el filtro
    await waitFor(() => {
      expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    })
  })

  it('filtra por documento correctamente', async () => {
    render(<RoomHistory />)
    
    await waitFor(() => {
      const documentInput = screen.getByPlaceholderText('Número de documento')
      fireEvent.change(documentInput, { target: { value: '12345678' } })
    })
    
    // Verificar que se aplica el filtro
    await waitFor(() => {
      expect(screen.getByDisplayValue('12345678')).toBeInTheDocument()
    })
  })

  it('limpia filtros correctamente', async () => {
    render(<RoomHistory />)
    
    // Aplicar algunos filtros
    await waitFor(() => {
      const userInput = screen.getByPlaceholderText('Nombre de usuario')
      fireEvent.change(userInput, { target: { value: 'test' } })
    })
    
    // Limpiar filtros
    const clearButton = screen.getByText('Borrar filtros')
    fireEvent.click(clearButton)
    
    // Verificar que los filtros se limpiaron
    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
    })
  })

  it('muestra indicador de actualización durante refresh', async () => {
    const mockService = await import('../../services/roomEntryService')
    mockService.getAllEntriesUnpaginated = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    )

    render(<RoomHistory />)
    
    // Simular refresh
    const refreshButton = screen.getByText('⟳')
    fireEvent.click(refreshButton)
    
    expect(screen.getByText('ACTUALIZANDO...')).toBeInTheDocument()
  })
})


