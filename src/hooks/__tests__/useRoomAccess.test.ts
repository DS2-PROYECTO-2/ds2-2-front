import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomAccess } from '../useRoomAccess';
import roomAccessService from '../../services/roomAccessService';
import { parseRoomAccessError, getErrorMessage } from '../../utils/roomAccessErrors';

// Mock de roomAccessService
vi.mock('../../services/roomAccessService', () => ({
  default: {
    validateRoomAccess: vi.fn(),
    registerRoomEntry: vi.fn(),
    registerRoomExit: vi.fn(),
    canAccessRoom: vi.fn(),
    getActiveSchedules: vi.fn(),
    getCurrentScheduleInfo: vi.fn()
  }
}));

// Mock de roomAccessErrors
vi.mock('../../utils/roomAccessErrors', () => ({
  parseRoomAccessError: vi.fn(),
  getErrorMessage: vi.fn()
}));

describe('useRoomAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook básico', () => {
  it('debería ser un hook', () => {
    expect(useRoomAccess).toBeDefined();
    expect(typeof useRoomAccess).toBe('function');
  });

    it('debería retornar funciones y estados', () => {
      const { result } = renderHook(() => useRoomAccess());

      expect(result.current.isValidating).toBe(false);
      expect(result.current.lastValidation).toBe(null);
      expect(typeof result.current.validateAccess).toBe('function');
      expect(typeof result.current.registerEntry).toBe('function');
      expect(typeof result.current.registerExit).toBe('function');
      expect(typeof result.current.canAccessRoom).toBe('function');
      expect(typeof result.current.getActiveSchedules).toBe('function');
      expect(typeof result.current.getCurrentScheduleInfo).toBe('function');
    });
  });

  describe('validateAccess', () => {
    it('debería validar acceso exitosamente', async () => {
      const mockValidation = {
        access_granted: true,
        reason: 'Acceso permitido',
        schedule: { 
          id: 1, 
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A' 
        }
      };

      vi.mocked(roomAccessService.validateRoomAccess).mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useRoomAccess());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateAccess(1, 'entry', '2024-01-01T10:00:00Z');
      });

      expect(vi.mocked(roomAccessService.validateRoomAccess)).toHaveBeenCalledWith({
        room_id: 1,
        access_type: 'entry',
        access_datetime: '2024-01-01T10:00:00Z'
      });
      expect(validationResult).toEqual(mockValidation);
      expect(result.current.lastValidation).toEqual(mockValidation);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(roomAccessService.validateRoomAccess).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccess());

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateAccess(1, 'entry');
      });

      expect(console.error).toHaveBeenCalledWith('Error validating room access:', error);
      expect(validationResult).toEqual({
        access_granted: false,
        reason: 'Error al validar acceso'
      });
      expect(result.current.lastValidation).toEqual({
        access_granted: false,
        reason: 'Error al validar acceso'
      });
    });

    it('debería manejar estado de validación', async () => {
      vi.mocked(roomAccessService.validateRoomAccess).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ access_granted: true }), 100))
      );

      const { result } = renderHook(() => useRoomAccess());

      expect(result.current.isValidating).toBe(false);

      let validationPromise: Promise<unknown>;
      act(() => {
        validationPromise = result.current.validateAccess(1, 'entry');
      });

      expect(result.current.isValidating).toBe(true);

      await act(async () => {
        await validationPromise;
      });

      expect(result.current.isValidating).toBe(false);
    });

    it('debería actualizar lastValidation en caso de error', async () => {
      const error = new Error('Network error');
      vi.mocked(roomAccessService.validateRoomAccess).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccess());

      await act(async () => {
        await result.current.validateAccess(1, 'exit');
      });

      expect(result.current.lastValidation).toEqual({
        access_granted: false,
        reason: 'Error al validar acceso'
      });
    });
  });

  describe('registerEntry', () => {
    it('debería registrar entrada exitosamente', async () => {
      const mockResult = {
        success: true,
        message: 'Entrada registrada exitosamente',
        entry_id: 1
      };

      vi.mocked(roomAccessService.registerRoomEntry).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useRoomAccess());

      let entryResult;
      await act(async () => {
        entryResult = await result.current.registerEntry(1, '2024-01-01T10:00:00Z');
      });

      expect(vi.mocked(roomAccessService.registerRoomEntry)).toHaveBeenCalledWith(1, '2024-01-01T10:00:00Z');
      expect(entryResult).toEqual(mockResult);
    });

    it('debería manejar errores con parseo', async () => {
      const error = { response: { data: { error: 'Sin turno asignado' } } };
      const parsedError = {
        type: 'schedule_required' as const,
        message: 'No tienes turno asignado para esta sala',
        details: {}
      };

      vi.mocked(roomAccessService.registerRoomEntry).mockRejectedValue(error);
      vi.mocked(parseRoomAccessError).mockReturnValue(parsedError);
      vi.mocked(getErrorMessage).mockReturnValue('No tienes turno asignado para esta sala');

      const { result } = renderHook(() => useRoomAccess());

      let entryResult;
      await act(async () => {
        entryResult = await result.current.registerEntry(1);
      });

      expect(console.error).toHaveBeenCalledWith('Error registering entry:', error);
      expect(parseRoomAccessError).toHaveBeenCalledWith(error);
      expect(getErrorMessage).toHaveBeenCalledWith(parsedError);
      expect(entryResult).toEqual({
        success: false,
        message: 'No tienes turno asignado para esta sala'
      });
    });

    it('debería manejar errores genéricos', async () => {
      const error = new Error('Generic error');
      const parsedError = {
        type: 'server_error' as const,
        message: 'Error del servidor',
        details: {}
      };

      vi.mocked(roomAccessService.registerRoomEntry).mockRejectedValue(error);
      vi.mocked(parseRoomAccessError).mockReturnValue(parsedError);
      vi.mocked(getErrorMessage).mockReturnValue('Error del servidor');

      const { result } = renderHook(() => useRoomAccess());

      let entryResult;
      await act(async () => {
        entryResult = await result.current.registerEntry(1);
      });

      expect(console.error).toHaveBeenCalledWith('Error registering entry:', error);
      expect(parseRoomAccessError).toHaveBeenCalledWith(error);
      expect(getErrorMessage).toHaveBeenCalledWith(parsedError);
      expect(entryResult).toEqual({
        success: false,
        message: 'Error del servidor'
      });
    });
  });

  describe('registerExit', () => {
    it('debería registrar salida exitosamente', async () => {
      const mockResult = {
        success: true,
        message: 'Salida registrada exitosamente',
        exit_id: 1
      };

      vi.mocked(roomAccessService.registerRoomExit).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useRoomAccess());

      let exitResult;
      await act(async () => {
        exitResult = await result.current.registerExit(1, '2024-01-01T17:00:00Z');
      });

      expect(vi.mocked(roomAccessService.registerRoomExit)).toHaveBeenCalledWith(1, '2024-01-01T17:00:00Z');
      expect(exitResult).toEqual(mockResult);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(roomAccessService.registerRoomExit).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccess());

      let exitResult;
      await act(async () => {
        exitResult = await result.current.registerExit(1);
      });

      expect(console.error).toHaveBeenCalledWith('Error registering exit:', error);
      expect(exitResult).toEqual({
        success: false,
        message: 'Error al registrar salida'
      });
    });
  });

  describe('canAccessRoom', () => {
    it('debería verificar acceso exitosamente', async () => {
      const mockResult = {
        canAccess: true,
        reason: 'Acceso permitido',
        schedule: { 
          id: 1, 
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A' 
        }
      };

      vi.mocked(roomAccessService.canAccessRoom).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useRoomAccess());

      let accessResult;
      await act(async () => {
        accessResult = await result.current.canAccessRoom(1);
      });

      expect(vi.mocked(roomAccessService.canAccessRoom)).toHaveBeenCalledWith(1);
      expect(accessResult).toEqual(mockResult);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(roomAccessService.canAccessRoom).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccess());

      let accessResult;
      await act(async () => {
        accessResult = await result.current.canAccessRoom(1);
      });

      expect(console.error).toHaveBeenCalledWith('Error checking room access:', error);
      expect(accessResult).toEqual({
        canAccess: false,
        reason: 'Error al verificar acceso'
      });
    });
  });

  describe('getActiveSchedules', () => {
    it('debería obtener turnos activos exitosamente', async () => {
      const mockSchedules = [
        { 
          id: 1, 
          room_name: 'Sala A', 
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          user_id: 1
        },
        { 
          id: 2, 
          room_name: 'Sala B', 
          start_datetime: '2024-01-01T10:00:00Z',
          end_datetime: '2024-01-01T18:00:00Z',
          user_id: 2
        }
      ];

      vi.mocked(roomAccessService.getActiveSchedules).mockResolvedValue(mockSchedules);

      const { result } = renderHook(() => useRoomAccess());

      let schedules;
      await act(async () => {
        schedules = await result.current.getActiveSchedules();
      });

      expect(vi.mocked(roomAccessService.getActiveSchedules)).toHaveBeenCalled();
      expect(schedules).toEqual(mockSchedules);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(roomAccessService.getActiveSchedules).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccess());

      let schedules;
      await act(async () => {
        schedules = await result.current.getActiveSchedules();
      });

      expect(console.error).toHaveBeenCalledWith('Error getting active schedules:', error);
      expect(schedules).toEqual([]);
    });
  });

  describe('getCurrentScheduleInfo', () => {
    it('debería obtener información del turno actual exitosamente', async () => {
      const mockInfo = {
        hasActiveSchedule: true,
        message: 'Tienes un turno activo',
        schedule: { 
          id: 1, 
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room_name: 'Sala A',
          user_id: 1
        }
      };

      vi.mocked(roomAccessService.getCurrentScheduleInfo).mockResolvedValue(mockInfo);

      const { result } = renderHook(() => useRoomAccess());

      let scheduleInfo;
      await act(async () => {
        scheduleInfo = await result.current.getCurrentScheduleInfo();
      });

      expect(vi.mocked(roomAccessService.getCurrentScheduleInfo)).toHaveBeenCalled();
      expect(scheduleInfo).toEqual(mockInfo);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(roomAccessService.getCurrentScheduleInfo).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccess());

      let scheduleInfo;
      await act(async () => {
        scheduleInfo = await result.current.getCurrentScheduleInfo();
      });

      expect(console.error).toHaveBeenCalledWith('Error getting current schedule info:', error);
      expect(scheduleInfo).toEqual({
        hasActiveSchedule: false,
        message: 'Error al obtener información del turno'
      });
    });
  });

  describe('Estados del hook', () => {
    it('debería tener estado inicial correcto', () => {
      const { result } = renderHook(() => useRoomAccess());

      expect(result.current.isValidating).toBe(false);
      expect(result.current.lastValidation).toBe(null);
    });

    it('debería cambiar estado durante validación', async () => {
      vi.mocked(roomAccessService.validateRoomAccess).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ access_granted: true }), 100))
      );

      const { result } = renderHook(() => useRoomAccess());

      expect(result.current.isValidating).toBe(false);

      let validationPromise: Promise<unknown>;
      act(() => {
        validationPromise = result.current.validateAccess(1, 'entry');
      });

      expect(result.current.isValidating).toBe(true);

      await act(async () => {
        await validationPromise;
      });

      expect(result.current.isValidating).toBe(false);
    });
  });
});
