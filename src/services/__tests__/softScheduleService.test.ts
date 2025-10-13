import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import softScheduleService from '../softScheduleService';
import type { Schedule, CreateScheduleData, UpdateScheduleData, ScheduleFilters } from '../softScheduleService';
import { apiClient } from '../../utils/api';

// Mock de apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock de softSecurityMiddleware
vi.mock('../../utils/softSecurityMiddleware', () => ({
  softAdminOnly: vi.fn((fn) => fn()),
  softAuthenticatedOnly: vi.fn((fn) => fn())
}));

describe('softScheduleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Métodos básicos', () => {
  it('debería ser un servicio', () => {
    expect(softScheduleService).toBeDefined();
    expect(typeof softScheduleService).toBe('object');
  });

  it('debería tener métodos definidos', () => {
    expect(typeof softScheduleService.getSchedules).toBe('function');
    expect(typeof softScheduleService.getSchedule).toBe('function');
    expect(typeof softScheduleService.createSchedule).toBe('function');
    expect(typeof softScheduleService.updateSchedule).toBe('function');
    expect(typeof softScheduleService.deleteSchedule).toBe('function');
    expect(typeof softScheduleService.getMySchedules).toBe('function');
      expect(typeof softScheduleService.getCurrentSchedules).toBe('function');
      expect(typeof softScheduleService.validateRoomAccess).toBe('function');
      expect(typeof softScheduleService.checkCompliance).toBe('function');
    });
  });

  describe('getSchedules', () => {
    it('debería obtener turnos exitosamente', async () => {
      const mockSchedules: Schedule[] = [
        {
          id: 1,
          user: 1,
          user_name: 'test',
          user_full_name: 'Test User',
          room: 1,
          room_name: 'Sala A',
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          status: 'active',
          recurring: false,
          notes: 'Test schedule',
          created_at: '2024-01-01T08:00:00Z',
          updated_at: '2024-01-01T08:00:00Z'
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

      const result = await softScheduleService.getSchedules();

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/schedule/schedules/');
      expect(result).toEqual(mockSchedules);
    });

    it('debería obtener turnos con filtros', async () => {
      const mockSchedules: Schedule[] = [];
      const filters: ScheduleFilters = {
        user: 1,
        room: 2,
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        status: 'active'
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

      const result = await softScheduleService.getSchedules(filters);

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/schedule/schedules/?user=1&room=2&date_from=2024-01-01&date_to=2024-01-31&status=active');
      expect(result).toEqual(mockSchedules);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(softScheduleService.getSchedules()).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error getting schedules:', error);
    });
  });

  describe('getSchedule', () => {
    it('debería obtener turno por ID exitosamente', async () => {
      const mockSchedule: Schedule = {
        id: 1,
        user: 1,
        user_name: 'test',
        user_full_name: 'Test User',
        room: 1,
        room_name: 'Sala A',
        start_datetime: '2024-01-01T09:00:00Z',
        end_datetime: '2024-01-01T17:00:00Z',
        status: 'active',
        recurring: false,
        notes: 'Test schedule',
        created_at: '2024-01-01T08:00:00Z',
        updated_at: '2024-01-01T08:00:00Z'
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedule);

      const result = await softScheduleService.getSchedule(1);

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/schedule/schedules/1/');
      expect(result).toEqual(mockSchedule);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(softScheduleService.getSchedule(1)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error getting schedule:', error);
    });
  });

  describe('createSchedule', () => {
    it('debería crear turno exitosamente', async () => {
      const createData: CreateScheduleData = {
        user: 1,
        room: 1,
        start_datetime: '2024-01-01T09:00:00Z',
        end_datetime: '2024-01-01T17:00:00Z',
        notes: 'Test schedule'
      };

      const mockSchedule: Schedule = {
        id: 1,
        user: 1,
        user_name: 'test',
        user_full_name: 'Test User',
        room: 1,
        room_name: 'Sala A',
        start_datetime: '2024-01-01T09:00:00Z',
        end_datetime: '2024-01-01T17:00:00Z',
        status: 'active',
        recurring: false,
        notes: 'Test schedule',
        created_at: '2024-01-01T08:00:00Z',
        updated_at: '2024-01-01T08:00:00Z'
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockSchedule);

      const result = await softScheduleService.createSchedule(createData);

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/api/schedule/schedules/', createData);
      expect(result).toEqual(mockSchedule);
    });

    it('debería manejar errores correctamente', async () => {
      const createData: CreateScheduleData = {
        user: 1,
        room: 1,
        start_datetime: '2024-01-01T09:00:00Z',
        end_datetime: '2024-01-01T17:00:00Z'
      };

      const error = new Error('API Error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(softScheduleService.createSchedule(createData)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error creating schedule:', error);
    });
  });

  describe('updateSchedule', () => {
    it('debería actualizar turno exitosamente', async () => {
      const updateData: UpdateScheduleData = {
        user: 2,
        room: 2,
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T18:00:00Z',
        notes: 'Updated schedule'
      };

      const mockSchedule: Schedule = {
        id: 1,
        user: 2,
        user_name: 'test',
        user_full_name: 'Test User',
        room: 2,
        room_name: 'Sala B',
        start_datetime: '2024-01-01T10:00:00Z',
        end_datetime: '2024-01-01T18:00:00Z',
        status: 'active',
        recurring: false,
        notes: 'Updated schedule',
        created_at: '2024-01-01T08:00:00Z',
        updated_at: '2024-01-01T08:00:00Z'
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockSchedule);

      const result = await softScheduleService.updateSchedule(1, updateData);

      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith('/api/schedule/schedules/1/', updateData);
      expect(result).toEqual(mockSchedule);
    });

    it('debería manejar errores correctamente', async () => {
      const updateData: UpdateScheduleData = {
        notes: 'Updated schedule'
      };

      const error = new Error('API Error');
      vi.mocked(apiClient.patch).mockRejectedValue(error);

      await expect(softScheduleService.updateSchedule(1, updateData)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error updating schedule:', error);
    });
  });

  describe('deleteSchedule', () => {
    it('debería eliminar turno exitosamente', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await softScheduleService.deleteSchedule(1);

      expect(vi.mocked(apiClient.delete)).toHaveBeenCalledWith('/api/schedule/schedules/1/');
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      await expect(softScheduleService.deleteSchedule(1)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error deleting schedule:', error);
    });
  });

  describe('getMySchedules', () => {
    it('debería obtener mis turnos exitosamente', async () => {
      const mockSchedules: Schedule[] = [
        {
          id: 1,
          user: 1,
          user_name: 'test',
          user_full_name: 'Test User',
          room: 1,
          room_name: 'Sala A',
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          status: 'active',
          recurring: false,
          notes: 'Test schedule',
          created_at: '2024-01-01T08:00:00Z',
          updated_at: '2024-01-01T08:00:00Z'
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

      const result = await softScheduleService.getMySchedules();

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/schedule/schedules/my/');
      expect(result).toEqual(mockSchedules);
    });

    it('debería obtener mis turnos con filtros', async () => {
      const mockSchedules: Schedule[] = [];
      const filters: ScheduleFilters = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        status: 'active'
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

      const result = await softScheduleService.getMySchedules(filters);

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/schedule/schedules/my/?date_from=2024-01-01&date_to=2024-01-31&status=active');
      expect(result).toEqual(mockSchedules);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(softScheduleService.getMySchedules()).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error getting my schedules:', error);
    });
  });

  describe('getCurrentSchedules', () => {
    it('debería obtener turnos actuales exitosamente', async () => {
      const mockSchedules: Schedule[] = [
        {
          id: 1,
          user: 1,
          user_name: 'test',
          user_full_name: 'Test User',
          room: 1,
          room_name: 'Sala A',
          start_datetime: '2024-01-01T09:00:00Z',
          end_datetime: '2024-01-01T17:00:00Z',
          status: 'active',
          recurring: false,
          notes: 'Test schedule',
          created_at: '2024-01-01T08:00:00Z',
          updated_at: '2024-01-01T08:00:00Z'
        }
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

      const result = await softScheduleService.getCurrentSchedules();

      // Verificar que se llama con la fecha actual
      const today = new Date().toISOString().split('T')[0];
      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith(`/api/schedule/schedules/my/?date_from=${today}&date_to=${today}`);
      expect(result).toEqual(mockSchedules);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(softScheduleService.getCurrentSchedules()).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error getting current schedules:', error);
    });
  });

  describe('validateRoomAccess', () => {
    it('debería validar acceso a sala exitosamente', async () => {
      const mockResponse = {
        access_granted: true,
        reason: 'Acceso permitido',
        schedule: { id: 1, room_id: 1 }
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await softScheduleService.validateRoomAccess(1);

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/api/schedule/schedules/validate_room_access/', { room_id: 1 });
      expect(result).toEqual(mockResponse);
    });

    it('debería validar acceso con parámetros opcionales', async () => {
      const mockResponse = {
        access_granted: false,
        reason: 'No autorizado'
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await softScheduleService.validateRoomAccess(1, 2, '2024-01-01T10:00:00Z');

      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith('/api/schedule/schedules/validate_room_access/', {
        room_id: 1,
        user_id: 2,
        access_datetime: '2024-01-01T10:00:00Z'
      });
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(softScheduleService.validateRoomAccess(1)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error validating room access:', error);
    });
  });

  describe('checkCompliance', () => {
    it('debería verificar cumplimiento exitosamente', async () => {
      const mockResponse = {
        compliant: true,
        details: 'Turno cumplido correctamente'
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await softScheduleService.checkCompliance(1);

      expect(vi.mocked(apiClient.get)).toHaveBeenCalledWith('/api/schedule/schedules/1/compliance/');
      expect(result).toEqual(mockResponse);
    });

    it('debería manejar errores correctamente', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(softScheduleService.checkCompliance(1)).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error checking compliance:', error);
    });
  });

  describe('Interfaces', () => {
    it('debería manejar Schedule interface correctamente', () => {
      const mockSchedule: Schedule = {
      id: 1,
      user: 1,
      user_name: 'test',
      user_full_name: 'Test User',
      room: 1,
      room_name: 'Sala A',
      start_datetime: '2024-01-01T09:00:00Z',
      end_datetime: '2024-01-01T17:00:00Z',
        status: 'active',
      recurring: false,
      notes: 'Test schedule',
      created_at: '2024-01-01T08:00:00Z',
      updated_at: '2024-01-01T08:00:00Z'
    };

    expect(mockSchedule.id).toBe(1);
    expect(mockSchedule.user).toBe(1);
    expect(mockSchedule.room).toBe(1);
    expect(mockSchedule.status).toBe('active');
    expect(mockSchedule.recurring).toBe(false);
  });

    it('debería manejar CreateScheduleData interface correctamente', () => {
      const mockCreateData: CreateScheduleData = {
      user: 1,
      room: 1,
      start_datetime: '2024-01-01T09:00:00Z',
      end_datetime: '2024-01-01T17:00:00Z',
      notes: 'Test schedule'
    };

    expect(mockCreateData.user).toBe(1);
    expect(mockCreateData.room).toBe(1);
    expect(mockCreateData.start_datetime).toBe('2024-01-01T09:00:00Z');
    expect(mockCreateData.end_datetime).toBe('2024-01-01T17:00:00Z');
    expect(mockCreateData.notes).toBe('Test schedule');
  });

    it('debería manejar UpdateScheduleData interface correctamente', () => {
      const mockUpdateData: UpdateScheduleData = {
      user: 2,
      room: 2,
      start_datetime: '2024-01-01T10:00:00Z',
      end_datetime: '2024-01-01T18:00:00Z',
      notes: 'Updated schedule'
    };

    expect(mockUpdateData.user).toBe(2);
    expect(mockUpdateData.room).toBe(2);
    expect(mockUpdateData.start_datetime).toBe('2024-01-01T10:00:00Z');
    expect(mockUpdateData.end_datetime).toBe('2024-01-01T18:00:00Z');
    expect(mockUpdateData.notes).toBe('Updated schedule');
    });
  });
});
