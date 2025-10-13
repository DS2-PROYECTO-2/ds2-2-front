import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoomAccessLogic } from '../useRoomAccessLogic';

// Mock de useAuth
const mockUseAuth = vi.fn();
vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock de useRoomAccess
const mockUseRoomAccess = vi.fn();
vi.mock('../useRoomAccess', () => ({
  useRoomAccess: () => mockUseRoomAccess()
}));

describe('useRoomAccessLogic', () => {
  const mockMonitorUser = {
    id: 1,
    username: 'monitor',
    email: 'monitor@test.com',
    role: 'monitor',
    is_verified: true
  };

  const mockAdminUser = {
    id: 2,
    username: 'admin',
    email: 'admin@test.com',
    role: 'admin',
    is_verified: true
  };

  const mockRoomAccess = {
    validateAccess: vi.fn(),
    registerEntry: vi.fn(),
    registerExit: vi.fn(),
    canAccessRoom: vi.fn(),
    getCurrentScheduleInfo: vi.fn(),
    isValidating: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockUseAuth.mockReturnValue({ user: mockMonitorUser });
    mockUseRoomAccess.mockReturnValue(mockRoomAccess);
    
    // Mock por defecto para canAccessRoom
    vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue({
      canAccess: false,
      reason: 'Sin turno asignado'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook básico', () => {
  it('debería ser un hook', () => {
    expect(useRoomAccessLogic).toBeDefined();
    expect(typeof useRoomAccessLogic).toBe('function');
  });

    it('debería aceptar roomId como parámetro y retornar funciones', () => {
      const { result } = renderHook(() => useRoomAccessLogic(1));

      expect(result.current.accessState).toBeDefined();
      expect(result.current.isValidating).toBe(false);
      expect(typeof result.current.checkAccess).toBe('function');
      expect(typeof result.current.attemptEntry).toBe('function');
      expect(typeof result.current.attemptExit).toBe('function');
      expect(typeof result.current.hasScheduleInRoom).toBe('function');
      expect(typeof result.current.getScheduleInfo).toBe('function');
      expect(typeof result.current.validateRealTimeAccess).toBe('function');
      expect(typeof result.current.canAccessNow).toBe('function');
      expect(typeof result.current.getActiveSchedules).toBe('function');
    });
  });

  describe('checkAccess', () => {
    it('debería verificar acceso exitosamente para monitor', async () => {
      const mockAccessInfo = {
        canAccess: true,
        reason: 'Acceso permitido',
        schedule: {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room: 1,
          room_name: 'Sala A'
        }
      };

      vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue(mockAccessInfo);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.checkAccess();
      });

      expect(vi.mocked(mockRoomAccess.canAccessRoom)).toHaveBeenCalledWith(1);
      expect(result.current.accessState.hasAccess).toBe(true);
      expect(result.current.accessState.reason).toBe('Acceso permitido');
      expect(result.current.accessState.currentSchedule).toEqual({
        ...mockAccessInfo.schedule,
        room: 1
      });
    });

    it('debería denegar acceso para no-monitor', async () => {
      mockUseAuth.mockReturnValue({ user: mockAdminUser });

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.checkAccess();
      });

      expect(result.current.accessState.hasAccess).toBe(false);
      expect(result.current.accessState.reason).toBe('Solo los monitores pueden acceder a salas');
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.canAccessRoom).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.checkAccess();
      });

      expect(console.error).toHaveBeenCalledWith('Error checking room access:', error);
      expect(result.current.accessState.hasAccess).toBe(false);
      expect(result.current.accessState.reason).toBe('Error al verificar acceso');
    });
  });

  describe('attemptEntry', () => {
    it('debería permitir entrada exitosa', async () => {
      const mockValidation = {
        access_granted: true,
        reason: 'Acceso permitido',
        schedule: { id: 1, room_name: 'Sala A' }
      };

      const mockEntryResult = {
        success: true,
        message: 'Entrada registrada exitosamente'
      };

      vi.mocked(mockRoomAccess.validateAccess).mockResolvedValue(mockValidation);
      vi.mocked(mockRoomAccess.registerEntry).mockResolvedValue(mockEntryResult);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let entryResult;
      await act(async () => {
        entryResult = await result.current.attemptEntry('2024-01-01T10:00:00Z');
      });

      expect(vi.mocked(mockRoomAccess.validateAccess)).toHaveBeenCalledWith(1, 'entry', '2024-01-01T10:00:00Z');
      expect(vi.mocked(mockRoomAccess.registerEntry)).toHaveBeenCalledWith(1, '2024-01-01T10:00:00Z');
      expect(entryResult).toEqual(mockEntryResult);
      expect(result.current.accessState.hasAccess).toBe(true);
      expect(result.current.accessState.isInRoom).toBe(true);
      expect(result.current.accessState.lastEntryTime).toBe('2024-01-01T10:00:00Z');
    });

    it('debería denegar entrada para no-monitor', async () => {
      mockUseAuth.mockReturnValue({ user: mockAdminUser });

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let entryResult;
      await act(async () => {
        entryResult = await result.current.attemptEntry();
      });

      expect(entryResult).toEqual({
        success: false,
        message: 'Solo los monitores pueden acceder a salas'
      });
    });

    it('debería manejar validación fallida', async () => {
      const mockValidation = {
        access_granted: false,
        reason: 'Sin turno asignado'
      };

      vi.mocked(mockRoomAccess.validateAccess).mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let entryResult;
      await act(async () => {
        entryResult = await result.current.attemptEntry();
      });

      expect(entryResult).toEqual({
        success: false,
        message: 'Sin turno asignado'
      });
      expect(result.current.accessState.hasAccess).toBe(false);
      expect(result.current.accessState.reason).toBe('Sin turno asignado');
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.validateAccess).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let entryResult;
      await act(async () => {
        entryResult = await result.current.attemptEntry();
      });

      expect(console.error).toHaveBeenCalledWith('Error attempting room entry:', error);
      expect(entryResult).toEqual({
        success: false,
        message: 'Error al procesar entrada'
      });
    });
  });

  describe('attemptExit', () => {
    it('debería permitir salida exitosa', async () => {
      const mockExitResult = {
        success: true,
        message: 'Salida registrada exitosamente'
      };

      vi.mocked(mockRoomAccess.registerExit).mockResolvedValue(mockExitResult);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let exitResult;
      await act(async () => {
        exitResult = await result.current.attemptExit('2024-01-01T17:00:00Z');
      });

      expect(vi.mocked(mockRoomAccess.registerExit)).toHaveBeenCalledWith(1, '2024-01-01T17:00:00Z');
      expect(exitResult).toEqual(mockExitResult);
      expect(result.current.accessState.hasAccess).toBe(false);
      expect(result.current.accessState.isInRoom).toBe(false);
      expect(result.current.accessState.lastExitTime).toBe('2024-01-01T17:00:00Z');
    });

    it('debería denegar salida para no-monitor', async () => {
      mockUseAuth.mockReturnValue({ user: mockAdminUser });

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let exitResult;
      await act(async () => {
        exitResult = await result.current.attemptExit();
      });

      expect(exitResult).toEqual({
        success: false,
        message: 'Solo los monitores pueden acceder a salas'
      });
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.registerExit).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let exitResult;
      await act(async () => {
        exitResult = await result.current.attemptExit();
      });

      expect(console.error).toHaveBeenCalledWith('Error attempting room exit:', error);
      expect(exitResult).toEqual({
        success: false,
        message: 'Error al procesar salida'
      });
    });
  });

  describe('hasScheduleInRoom', () => {
    it('debería verificar turno exitosamente', async () => {
      const mockAccessInfo = {
        canAccess: true,
        reason: 'Tienes turno asignado'
      };

      vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue(mockAccessInfo);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let hasSchedule;
      await act(async () => {
        hasSchedule = await result.current.hasScheduleInRoom();
      });

      expect(vi.mocked(mockRoomAccess.canAccessRoom)).toHaveBeenCalledWith(1);
      expect(hasSchedule).toBe(true);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.canAccessRoom).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let hasSchedule;
      await act(async () => {
        hasSchedule = await result.current.hasScheduleInRoom();
      });

      expect(console.error).toHaveBeenCalledWith('Error checking schedule in room:', error);
      expect(hasSchedule).toBe(false);
    });
  });

  describe('getScheduleInfo', () => {
    it('debería obtener información del turno exitosamente', async () => {
      const mockScheduleInfo = {
        hasActiveSchedule: true,
        message: 'Tienes un turno activo',
        schedule: { id: 1, room_name: 'Sala A' }
      };

      vi.mocked(mockRoomAccess.getCurrentScheduleInfo).mockResolvedValue(mockScheduleInfo);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let scheduleInfo;
      await act(async () => {
        scheduleInfo = await result.current.getScheduleInfo();
      });

      expect(vi.mocked(mockRoomAccess.getCurrentScheduleInfo)).toHaveBeenCalled();
      expect(scheduleInfo).toEqual(mockScheduleInfo);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.getCurrentScheduleInfo).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let scheduleInfo;
      await act(async () => {
        scheduleInfo = await result.current.getScheduleInfo();
      });

      expect(console.error).toHaveBeenCalledWith('Error getting schedule info:', error);
      expect(scheduleInfo).toEqual({
        hasActiveSchedule: false,
        message: 'Error al obtener información del turno'
      });
    });
  });

  describe('validateRealTimeAccess', () => {
    it('debería validar acceso en tiempo real exitosamente', async () => {
      const mockValidation = {
        access_granted: true,
        reason: 'Acceso permitido',
        schedule: { id: 1, room_name: 'Sala A' }
      };

      vi.mocked(mockRoomAccess.validateAccess).mockResolvedValue(mockValidation);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.validateRealTimeAccess();
      });

      expect(vi.mocked(mockRoomAccess.validateAccess)).toHaveBeenCalledWith(1, 'entry');
      expect(result.current.accessState.hasAccess).toBe(true);
      expect(result.current.accessState.reason).toBe('Acceso permitido');
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.validateAccess).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.validateRealTimeAccess();
      });

      expect(console.error).toHaveBeenCalledWith('Error validating real-time access:', error);
    });
  });

  describe('canAccessNow', () => {
    it('debería verificar acceso actual exitosamente', async () => {
      const mockAccessInfo = {
        canAccess: true,
        reason: 'Acceso permitido',
        schedule: {
          id: 1,
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          room: 1,
          room_name: 'Sala A'
        }
      };

      vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue(mockAccessInfo);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let accessInfo;
      await act(async () => {
        accessInfo = await result.current.canAccessNow();
      });

      expect(vi.mocked(mockRoomAccess.canAccessRoom)).toHaveBeenCalledWith(1);
      expect(accessInfo).toEqual({
        canAccess: true,
        reason: 'Acceso permitido',
        schedule: {
          ...mockAccessInfo.schedule,
          room: 1
        }
      });
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.canAccessRoom).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let accessInfo;
      await act(async () => {
        accessInfo = await result.current.canAccessNow();
      });

      expect(console.error).toHaveBeenCalledWith('Error checking current access:', error);
      expect(accessInfo).toEqual({
        canAccess: false,
        reason: 'Error al verificar acceso'
      });
    });
  });

  describe('getActiveSchedules', () => {
    it('debería obtener turnos activos exitosamente', async () => {
      const mockScheduleInfo = {
        hasActiveSchedule: true,
        message: 'Tienes turnos activos',
        schedules: [{ id: 1, room_name: 'Sala A' }]
      };

      vi.mocked(mockRoomAccess.getCurrentScheduleInfo).mockResolvedValue(mockScheduleInfo);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let schedules;
      await act(async () => {
        schedules = await result.current.getActiveSchedules();
      });

      expect(vi.mocked(mockRoomAccess.getCurrentScheduleInfo)).toHaveBeenCalled();
      expect(schedules).toEqual(mockScheduleInfo);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(mockRoomAccess.getCurrentScheduleInfo).mockRejectedValue(error);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      let schedules;
      await act(async () => {
        schedules = await result.current.getActiveSchedules();
      });

      expect(console.error).toHaveBeenCalledWith('Error getting active schedules:', error);
      expect(schedules).toEqual({
        hasActiveSchedule: false,
        message: 'Error al obtener turnos activos'
      });
    });
  });

  describe('Estados del hook', () => {
    it('debería tener estado inicial correcto', () => {
      const { result } = renderHook(() => useRoomAccessLogic(1));

      expect(result.current.accessState.hasAccess).toBe(false);
      expect(result.current.accessState.reason).toBe('');
      expect(result.current.accessState.currentSchedule).toBe(null);
      expect(result.current.accessState.isInRoom).toBe(false);
      expect(result.current.accessState.lastEntryTime).toBe(null);
      expect(result.current.accessState.lastExitTime).toBe(null);
      expect(result.current.hasAccess).toBe(false);
      expect(result.current.isInRoom).toBe(false);
      expect(result.current.currentSchedule).toBe(null);
      expect(result.current.accessReason).toBe('');
    });

    it('debería actualizar estados derivados correctamente', async () => {
      const mockAccessInfo = {
        canAccess: true,
      reason: 'Acceso permitido',
        schedule: {
        id: 1,
        start_datetime: '2024-01-01T09:00:00Z',
        end_datetime: '2024-01-01T17:00:00Z',
        room: 1,
        room_name: 'Sala A'
        }
      };

      vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue(mockAccessInfo);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.checkAccess();
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.accessReason).toBe('Acceso permitido');
      expect(result.current.currentSchedule).toEqual({
        ...mockAccessInfo.schedule,
        room: 1
      });
    });

    it('debería manejar cambios de estado durante operaciones', async () => {
      const mockValidation = {
        access_granted: true,
        reason: 'Acceso permitido'
      };

      const mockEntryResult = {
        success: true,
        message: 'Entrada registrada'
      };

      vi.mocked(mockRoomAccess.validateAccess).mockResolvedValue(mockValidation);
      vi.mocked(mockRoomAccess.registerEntry).mockResolvedValue(mockEntryResult);

      const { result } = renderHook(() => useRoomAccessLogic(1));

      await act(async () => {
        await result.current.attemptEntry();
      });

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.isInRoom).toBe(true);
      expect(result.current.accessReason).toBe('Entrada autorizada');
    });
  });

  describe('useEffect', () => {
    it('debería verificar acceso automáticamente al montar para monitor', async () => {
      const mockAccessInfo = {
        canAccess: true,
        reason: 'Acceso permitido'
      };

      vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue(mockAccessInfo);

      renderHook(() => useRoomAccessLogic(1));

      // Esperar a que se ejecute el useEffect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(vi.mocked(mockRoomAccess.canAccessRoom)).toHaveBeenCalledWith(1);
    });

    it('debería verificar acceso al cambiar roomId', async () => {
      const mockAccessInfo = {
        canAccess: true,
        reason: 'Acceso permitido'
      };

      vi.mocked(mockRoomAccess.canAccessRoom).mockResolvedValue(mockAccessInfo);

      const { rerender } = renderHook(
        ({ roomId }) => useRoomAccessLogic(roomId),
        { initialProps: { roomId: 1 } }
      );

      // Cambiar roomId
      rerender({ roomId: 2 });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(vi.mocked(mockRoomAccess.canAccessRoom)).toHaveBeenCalledWith(2);
    });
  });
});
