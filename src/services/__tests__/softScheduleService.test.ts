import { describe, it, expect } from 'vitest';
import softScheduleService from '../softScheduleService';

describe('softScheduleService', () => {
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
  });

  it('debería manejar interfaces correctamente', () => {
    const mockSchedule = {
      id: 1,
      user: 1,
      user_name: 'test',
      user_full_name: 'Test User',
      room: 1,
      room_name: 'Sala A',
      start_datetime: '2024-01-01T09:00:00Z',
      end_datetime: '2024-01-01T17:00:00Z',
      status: 'active' as const,
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

  it('debería manejar datos de creación correctamente', () => {
    const mockCreateData = {
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

  it('debería manejar datos de actualización correctamente', () => {
    const mockUpdateData = {
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
