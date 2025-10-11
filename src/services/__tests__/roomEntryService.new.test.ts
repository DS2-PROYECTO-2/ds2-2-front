import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createEntry, 
  exitEntry, 
  getAllEntriesUnpaginated,
  getMyEntries,
  getMyActiveEntry 
} from '../roomEntryService'

// Mock del apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
    get: vi.fn()
  }
}))

describe('roomEntryService - New Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEntry', () => {
    it('crea entrada con payload correcto', async () => {
      const mockApiClient = await import('../../utils/api')
      mockApiClient.apiClient.post = vi.fn().mockResolvedValue({
        id: 1,
        room: 1,
        notes: 'Test entry'
      })

      const result = await createEntry(1, 'Test entry')

      expect(mockApiClient.apiClient.post).toHaveBeenCalledWith('/api/rooms/entry/', {
        room: 1,
        notes: 'Test entry'
      })
      expect(result).toEqual({
        id: 1,
        room: 1,
        notes: 'Test entry'
      })
    })

    it('maneja errores 400 correctamente', async () => {
      const mockApiClient = await import('../../utils/api')
      const error400 = {
        status: 400,
        response: {
          data: {
            error: 'Sin turno asignado para esta sala',
            details: {
              reason: 'schedule_required',
              current_time: '2025-01-15 10:00:00',
              room: 'Sala Test',
              user: 'usuario.test'
            }
          }
        }
      }
      mockApiClient.apiClient.post = vi.fn().mockRejectedValue(error400)

      await expect(createEntry(1, 'Test entry')).rejects.toThrow('Error de validación: Sin turno asignado para esta sala')
    })

    it('maneja errores 403 correctamente', async () => {
      const mockApiClient = await import('../../utils/api')
      const error403 = {
        status: 403,
        response: {
          data: { error: 'No tienes permisos para acceder a esta sala' }
        }
      }
      mockApiClient.apiClient.post = vi.fn().mockRejectedValue(error403)

      await expect(createEntry(1, 'Test entry')).rejects.toThrow('No tienes permisos para acceder a esta sala')
    })

    it('maneja errores 404 correctamente', async () => {
      const mockApiClient = await import('../../utils/api')
      const error404 = {
        status: 404,
        response: {
          data: { error: 'Sala no encontrada' }
        }
      }
      mockApiClient.apiClient.post = vi.fn().mockRejectedValue(error404)

      await expect(createEntry(1, 'Test entry')).rejects.toThrow('Sala no encontrada')
    })

    it('dispara eventos de actualización en tiempo real', async () => {
      const mockApiClient = await import('../../utils/api')
      mockApiClient.apiClient.post = vi.fn().mockResolvedValue({
        id: 1,
        room: 1,
        notes: 'Test entry'
      })

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')

      await createEntry(1, 'Test entry')

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'room-entry-updated',
          detail: expect.objectContaining({
            type: 'entry_created',
            roomId: 1
          })
        })
      )
      expect(localStorageSpy).toHaveBeenCalledWith('room-entry-updated', expect.any(String))
    })
  })

  describe('exitEntry', () => {
    it('registra salida correctamente', async () => {
      const mockApiClient = await import('../../utils/api')
      mockApiClient.apiClient.patch = vi.fn().mockResolvedValue({
        id: 1,
        exit_time: '2025-01-15T17:00:00Z',
        notes: 'Test exit'
      })

      const result = await exitEntry(1, 'Test exit')

      expect(mockApiClient.apiClient.patch).toHaveBeenCalledWith('/api/rooms/entry/1/exit/', {
        notes: 'Test exit'
      })
      expect(result).toEqual({
        id: 1,
        exit_time: '2025-01-15T17:00:00Z',
        notes: 'Test exit'
      })
    })

    it('dispara eventos de actualización en tiempo real', async () => {
      const mockApiClient = await import('../../utils/api')
      mockApiClient.apiClient.patch = vi.fn().mockResolvedValue({
        id: 1,
        exit_time: '2025-01-15T17:00:00Z'
      })

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')

      await exitEntry(1, 'Test exit')

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'room-entry-updated',
          detail: expect.objectContaining({
            type: 'entry_exited',
            entryId: 1
          })
        })
      )
      expect(localStorageSpy).toHaveBeenCalledWith('room-entry-updated', expect.any(String))
    })

    it('maneja errores de entrada no encontrada', async () => {
      const mockApiClient = await import('../../utils/api')
      const errorNotFound = {
        data: {
          error: 'Entrada no encontrada',
          details: 'No se encontró entrada'
        }
      }
      mockApiClient.apiClient.patch = vi.fn()
        .mockRejectedValueOnce(errorNotFound)
        .mockResolvedValueOnce({
          message: 'Salida registrada exitosamente'
        })

      const result = await exitEntry(1, 'Test exit')

      expect(result).toEqual({
        message: 'Salida registrada exitosamente'
      })
    })
  })

  describe('getAllEntriesUnpaginated', () => {
    it('obtiene todos los registros sin paginación', async () => {
      const mockApiClient = await import('../../utils/api')
      const mockEntries = [
        {
          id: 1,
          room: 1,
          started_at: '2025-01-15T09:00:00Z',
          ended_at: '2025-01-15T17:00:00Z',
          user: 1,
          user_username: 'usuario1',
          user_full_name: 'Usuario 1',
          document: '12345678'
        }
      ]
      mockApiClient.apiClient.get = vi.fn().mockResolvedValue({
        entries: mockEntries
      })

      const result = await getAllEntriesUnpaginated({
        from: '2025-01-01',
        to: '2025-01-31',
        room: 1
      })

      expect(mockApiClient.apiClient.get).toHaveBeenCalledWith(
        '/api/rooms/entries/?from=2025-01-01&to=2025-01-31&room=1&page_size=10000'
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        roomId: 1,
        roomName: '',
        startedAt: '2025-01-15T09:00:00Z',
        endedAt: '2025-01-15T17:00:00Z',
        userId: 1,
        userName: undefined,
        userUsername: 'usuario1',
        userDocument: '12345678'
      })
    })

    it('aplica filtros correctamente', async () => {
      const mockApiClient = await import('../../utils/api')
      mockApiClient.apiClient.get = vi.fn().mockResolvedValue({
        entries: []
      })

      await getAllEntriesUnpaginated({
        from: '2025-01-01',
        to: '2025-01-31',
        room: 1,
        user_name: 'usuario',
        document: '12345678',
        active: true
      })

      expect(mockApiClient.apiClient.get).toHaveBeenCalledWith(
        '/api/rooms/entries/?from=2025-01-01&to=2025-01-31&user_name=usuario&room=1&active=true&document=12345678&page_size=10000'
      )
    })
  })

  describe('getMyEntries', () => {
    it('obtiene entradas del usuario actual', async () => {
      const mockApiClient = await import('../../utils/api')
      const mockEntries = [
        {
          id: 1,
          room: 1,
          started_at: '2025-01-15T09:00:00Z',
          ended_at: '2025-01-15T17:00:00Z'
        }
      ]
      mockApiClient.apiClient.get = vi.fn().mockResolvedValue(mockEntries)

      const result = await getMyEntries()

      expect(mockApiClient.apiClient.get).toHaveBeenCalledWith('/api/rooms/my-entries/')
      expect(result).toHaveLength(1)
    })
  })

  describe('getMyActiveEntry', () => {
    it('obtiene entrada activa del usuario', async () => {
      const mockApiClient = await import('../../utils/api')
      const mockResponse = {
        has_active_entry: true,
        active_entry: {
          id: 1,
          room: 1,
          started_at: '2025-01-15T09:00:00Z',
          ended_at: null
        }
      }
      mockApiClient.apiClient.get = vi.fn().mockResolvedValue(mockResponse)

      const result = await getMyActiveEntry()

      expect(mockApiClient.apiClient.get).toHaveBeenCalledWith('/api/rooms/my-active-entry/')
      expect(result).toEqual({
        has_active_entry: true,
        active_entry: {
          id: 1,
          roomId: 1,
          roomName: '',
          startedAt: '2025-01-15T09:00:00Z',
          endedAt: null,
          userId: undefined,
          userName: undefined,
          userUsername: undefined,
          userDocument: undefined
        }
      })
    })

    it('maneja caso sin entrada activa', async () => {
      const mockApiClient = await import('../../utils/api')
      const mockResponse = {
        has_active_entry: false
      }
      mockApiClient.apiClient.get = vi.fn().mockResolvedValue(mockResponse)

      const result = await getMyActiveEntry()

      expect(result).toEqual({
        has_active_entry: false
      })
    })
  })
})

