import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import roomAccessService from '../roomAccessService';
import type { RoomAccessRequest, RoomAccessValidation, RoomAccessResult, RoomAccessInfo } from '../roomAccessService';
import { apiClient } from '../../utils/api';

// Mock del apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

describe('roomAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error para evitar ruido en los tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Métodos básicos', () => {
  it('debería ser un servicio', () => {
    expect(roomAccessService).toBeDefined();
    expect(typeof roomAccessService).toBe('object');
  });

  it('debería tener métodos definidos', () => {
    expect(typeof roomAccessService.validateRoomAccess).toBe('function');
    expect(typeof roomAccessService.registerRoomEntry).toBe('function');
    expect(typeof roomAccessService.registerRoomExit).toBe('function');
    expect(typeof roomAccessService.canAccessRoom).toBe('function');
    expect(typeof roomAccessService.getActiveSchedules).toBe('function');
    expect(typeof roomAccessService.getCurrentScheduleInfo).toBe('function');
    });
  });

  describe('validateRoomAccess', () => {
    it('debería validar acceso exitosamente', async () => {
      const mockRequest: RoomAccessRequest = {
        room_id: 1,
        access_type: 'entry',
        access_datetime: '2024-01-01T10:00:00Z'
      };

      const mockResponse: RoomAccessValidation = {
        access_granted: true,
        reason: 'Acceso permitido',
        schedule: {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A'
        }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await roomAccessService.validateRoomAccess(mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/schedule/schedules/validate_room_access/', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar errores en validación', async () => {
      const mockRequest: RoomAccessRequest = {
        room_id: 1,
        access_type: 'entry'
      };

      vi.mocked(apiClient).post.mockRejectedValue(new Error('API Error'));

      const result = await roomAccessService.validateRoomAccess(mockRequest);

      expect(result).toEqual({
        access_granted: false,
        reason: 'Error al validar acceso'
      });
      expect(console.error).toHaveBeenCalledWith('Error validating room access:', expect.any(Error));
    });
  });

  describe('registerRoomEntry', () => {
    it('debería registrar entrada exitosamente', async () => {
      const mockResponse = {
        id: 1,
        room: 1,
        entry_time: '2024-01-01T10:00:00Z'
      };

      vi.mocked(apiClient).post.mockResolvedValue(mockResponse);

      const result = await roomAccessService.registerRoomEntry(1, '2024-01-01T10:00:00Z');

      expect(vi.mocked(apiClient).post).toHaveBeenCalledWith('/rooms/entry/', {
        room: 1,
        entry_time: '2024-01-01T10:00:00Z'
      });
      expect(result).toEqual({
        success: true,
        message: 'Entrada registrada exitosamente',
        data: mockResponse
      });
    });

    it('debería manejar errores en registro de entrada', async () => {
      vi.mocked(apiClient).post.mockRejectedValue(new Error('API Error'));

      const result = await roomAccessService.registerRoomEntry(1);

      expect(result).toEqual({
        success: false,
        message: 'Error al registrar entrada'
      });
      expect(console.error).toHaveBeenCalledWith('Error registering room entry:', expect.any(Error));
    });
  });

  describe('registerRoomExit', () => {
    it('debería registrar salida exitosamente', async () => {
      const mockResponse = {
        id: 1,
        room: 1,
        entry_time: '2024-01-01T10:00:00Z',
        exit_time: '2024-01-01T17:00:00Z'
      };

      vi.mocked(apiClient).patch.mockResolvedValue(mockResponse);

      const result = await roomAccessService.registerRoomExit(1, '2024-01-01T17:00:00Z');

      expect(vi.mocked(apiClient).patch).toHaveBeenCalledWith('/rooms/entry/1/exit/', {
        exit_time: '2024-01-01T17:00:00Z'
      });
      expect(result).toEqual({
        success: true,
        message: 'Salida registrada exitosamente',
        data: mockResponse
      });
    });

    it('debería manejar errores en registro de salida', async () => {
      vi.mocked(apiClient).patch.mockRejectedValue(new Error('API Error'));

      const result = await roomAccessService.registerRoomExit(1);

      expect(result).toEqual({
        success: false,
        message: 'Error al registrar salida'
      });
      expect(console.error).toHaveBeenCalledWith('Error registering room exit:', expect.any(Error));
    });
  });

  describe('canAccessRoom', () => {
    it('debería verificar acceso exitosamente', async () => {
      const mockResponse: RoomAccessInfo = {
        canAccess: true,
        reason: 'Acceso permitido',
        schedule: {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A'
        }
      };

      vi.mocked(apiClient).get.mockResolvedValue(mockResponse);

      const result = await roomAccessService.canAccessRoom(1);

      expect(vi.mocked(apiClient).get).toHaveBeenCalledWith('/rooms/1/access/');
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar errores en verificación de acceso', async () => {
      vi.mocked(apiClient).get.mockRejectedValue(new Error('API Error'));

      const result = await roomAccessService.canAccessRoom(1);

      expect(result).toEqual({
        canAccess: false,
        reason: 'Error al verificar acceso'
      });
      expect(console.error).toHaveBeenCalledWith('Error checking room access:', expect.any(Error));
    });
  });

  describe('getActiveSchedules', () => {
    it('debería obtener turnos activos exitosamente', async () => {
      const mockResponse = [
        {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A',
          user_id: 1
        }
      ];

      vi.mocked(apiClient).get.mockResolvedValue(mockResponse);

      const result = await roomAccessService.getActiveSchedules();

      expect(vi.mocked(apiClient).get).toHaveBeenCalledWith('/schedule/schedules/my_schedules/');
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar errores en obtención de turnos', async () => {
      vi.mocked(apiClient).get.mockRejectedValue(new Error('API Error'));

      const result = await roomAccessService.getActiveSchedules();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error getting active schedules:', expect.any(Error));
    });
  });

  describe('getCurrentScheduleInfo', () => {
    it('debería obtener información con turno activo', async () => {
      const mockSchedules = [
        {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A',
          user_id: 1
        }
      ];

      vi.mocked(apiClient).get.mockResolvedValue(mockSchedules);

      // Mock Date.now para simular tiempo actual dentro del rango
      const mockDate = new Date('2024-01-01T12:00:00Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      const result = await roomAccessService.getCurrentScheduleInfo();

      expect(result).toEqual({
        hasActiveSchedule: true,
        message: 'Tienes un turno activo en Sala A',
        schedule: mockSchedules[0]
      });

      vi.restoreAllMocks();
    });

    it('debería obtener información sin turno activo', async () => {
      const mockSchedules: unknown[] = [];

      vi.mocked(apiClient).get.mockResolvedValue(mockSchedules);

      const result = await roomAccessService.getCurrentScheduleInfo();

      expect(result).toEqual({
        hasActiveSchedule: false,
        message: 'No tienes un turno activo en este momento'
      });
    });

    it('debería manejar errores en obtención de información', async () => {
      // Mock getActiveSchedules para que retorne array vacío (comportamiento real cuando hay error)
      vi.mocked(apiClient.get).mockResolvedValue([]);

      const result = await roomAccessService.getCurrentScheduleInfo();

      expect(result).toEqual({
        hasActiveSchedule: false,
        message: 'No tienes un turno activo en este momento'
      });
    });
  });

  describe('Interfaces', () => {
    it('debería manejar RoomAccessRequest correctamente', () => {
      const request: RoomAccessRequest = {
      room_id: 1,
        access_type: 'entry',
      access_datetime: '2024-01-01T10:00:00Z'
    };

      expect(request.room_id).toBe(1);
      expect(request.access_type).toBe('entry');
      expect(request.access_datetime).toBe('2024-01-01T10:00:00Z');
    });

    it('debería manejar RoomAccessValidation correctamente', () => {
      const validation: RoomAccessValidation = {
        access_granted: true,
        reason: 'Acceso permitido',
        schedule: {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A'
        }
      };

      expect(validation.access_granted).toBe(true);
      expect(validation.reason).toBe('Acceso permitido');
      expect(validation.schedule).toBeDefined();
    });

    it('debería manejar RoomAccessResult correctamente', () => {
      const result: RoomAccessResult = {
        success: true,
        message: 'Operación exitosa',
        data: {
          id: 1,
          room: 1,
          entry_time: '2024-01-01T10:00:00Z'
        }
      };

      expect(result.success).toBe(true);
      expect(result.message).toBe('Operación exitosa');
      expect(result.data).toBeDefined();
    });
  });
});
