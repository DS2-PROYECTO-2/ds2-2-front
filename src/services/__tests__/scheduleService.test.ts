import { describe, it, expect, vi, beforeEach } from 'vitest';
import scheduleService from '../scheduleService';

// Mock del apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('scheduleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage para los tests
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mockToken123'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('obtiene lista de turnos con filtros', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockSchedules = [
      {
        id: 1,
        user: 1,
        user_name: 'Monitor 1',
        room: 1,
        room_name: 'Sala 1',
        start_datetime: '2024-01-15T08:00:00Z',
        end_datetime: '2024-01-15T16:00:00Z',
        status: 'active',
        recurring: false,
        notes: 'Turno de mañana',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

    const filters = {
      date_from: '2024-01-01',
      date_to: '2024-01-31',
      status: 'active' as const,
      user: 1
    };

    vi.mocked(apiClient.get).mockResolvedValue({ results: mockSchedules });

    const result = await scheduleService.getSchedules(filters);

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/schedule/schedules/?date_from=2024-01-01&date_to=2024-01-31&status=active&user=1'
    );
    expect(result).toEqual(mockSchedules);
  });

  it('crea un nuevo turno', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockSchedule = {
      id: 1,
      user: 1,
      user_name: 'Monitor 1',
      room: 1,
      room_name: 'Sala 1',
      start_datetime: '2024-01-15T08:00:00Z',
      end_datetime: '2024-01-15T16:00:00Z',
      status: 'active' as const,
      recurring: false,
      notes: 'Turno de mañana',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockSchedule);

    const scheduleData = {
      user: 1,
      room: 1,
      start_datetime: '2024-01-15T08:00:00Z',
      end_datetime: '2024-01-15T16:00:00Z',
      status: 'active' as const,
      recurring: false,
      notes: 'Turno de mañana'
    };

    const result = await scheduleService.createSchedule(scheduleData);

    expect(apiClient.post).toHaveBeenCalledWith('/api/schedule/schedules/', scheduleData);
    expect(result).toEqual(mockSchedule);
  });

  it('actualiza un turno existente', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockSchedule = {
      id: 1,
      user: 1,
      user_name: 'Monitor 1',
      room: 1,
      room_name: 'Sala 1',
      start_datetime: '2024-01-15T08:00:00Z',
      end_datetime: '2024-01-15T16:00:00Z',
      status: 'completed' as const,
      recurring: false,
      notes: 'Turno completado',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    vi.mocked(apiClient.patch).mockResolvedValue(mockSchedule);

    const updateData = {
      status: 'completed' as const,
      notes: 'Turno completado'
    };

    const result = await scheduleService.updateSchedule(1, updateData);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/schedule/schedules/1/', updateData);
    expect(result).toEqual(mockSchedule);
  });

  it('elimina un turno', async () => {
    const { apiClient } = await import('../../utils/api');
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    await scheduleService.deleteSchedule(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/schedule/schedules/1/');
  });

  it('obtiene turnos próximos', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockSchedules = [
      {
        id: 1,
        user: 1,
        user_name: 'Monitor 1',
        room: 1,
        room_name: 'Sala 1',
        start_datetime: '2024-01-15T08:00:00Z',
        end_datetime: '2024-01-15T16:00:00Z',
        status: 'active' as const,
        recurring: false,
        notes: 'Turno próximo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    vi.mocked(apiClient.get).mockResolvedValue(mockSchedules);

    const result = await scheduleService.getUpcomingSchedules();

    expect(apiClient.get).toHaveBeenCalledWith('/api/schedule/schedules/upcoming/');
    expect(result).toEqual(mockSchedules);
  });

  it('valida acceso a sala', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockValidation = {
      access_granted: true,
      schedule: {
        id: 1,
        user: 1,
        user_name: 'Monitor 1',
        room: 1,
        room_name: 'Sala 1',
        start_datetime: '2024-01-15T08:00:00Z',
        end_datetime: '2024-01-15T16:00:00Z',
        status: 'active' as const,
        recurring: false,
        notes: 'Turno activo',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    };

    vi.mocked(apiClient.post).mockResolvedValue(mockValidation);

    const result = await scheduleService.validateRoomAccess(1, 1, '2024-01-15T10:00:00Z');

    expect(apiClient.post).toHaveBeenCalledWith('/api/schedule/schedules/validate_room_access/', {
      room_id: 1,
      user_id: 1,
      access_datetime: '2024-01-15T10:00:00Z'
    });
    expect(result).toEqual(mockValidation);
  });

  it('obtiene mis turnos (para monitores)', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockMySchedules = {
      current_schedules: [],
      upcoming_schedules: [
        {
          id: 1,
          user: 1,
          user_name: 'Monitor 1',
          room: 1,
          room_name: 'Sala 1',
          start_datetime: '2024-01-15T08:00:00Z',
          end_datetime: '2024-01-15T16:00:00Z',
          status: 'active' as const,
          recurring: false,
          notes: 'Turno próximo',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      past_schedules: []
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockMySchedules);

    const filters = {
      date_from: '2024-01-01',
      date_to: '2024-01-31',
      status: 'all'
    };

    const result = await scheduleService.getMySchedules(filters);

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/schedule/my-schedules/?date_from=2024-01-01&date_to=2024-01-31&status=all'
    );
    expect(result).toEqual({
      current: [],
      upcoming: [
        {
          id: 1,
          user: 1,
          user_name: 'Monitor 1',
          room: 1,
          room_name: 'Sala 1',
          start_datetime: '2024-01-15T08:00:00Z',
          end_datetime: '2024-01-15T16:00:00Z',
          status: 'active' as const,
          recurring: false,
          notes: 'Turno próximo',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      past: []
    });
  });

  it('obtiene resumen general (para administradores)', async () => {
    const { apiClient } = await import('../../utils/api');
    const mockOverview = {
      total_schedules: 10,
      active_schedules: 5,
      upcoming_schedules: 3,
      compliance_rate: 85.5,
      recent_schedules: []
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockOverview);

    const result = await scheduleService.getOverview();

    expect(apiClient.get).toHaveBeenCalledWith('/api/schedule/admin/overview/');
    expect(result).toEqual(mockOverview);
  });
});
