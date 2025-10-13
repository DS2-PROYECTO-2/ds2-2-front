import { apiClient } from '../utils/api';
import { softAdminOnly, softAuthenticatedOnly } from '../utils/softSecurityMiddleware';

// Tipos de datos
export interface Schedule {
  id: number;
  user: number;
  user_name?: string;
  user_full_name?: string;
  room: number;
  room_name?: string;
  start_datetime: string;
  end_datetime: string;
  status: 'active' | 'completed' | 'cancelled';
  recurring: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleData {
  user: number;
  room: number;
  start_datetime: string;
  end_datetime: string;
  notes?: string;
}

export interface UpdateScheduleData {
  user?: number;
  room?: number;
  start_datetime?: string;
  end_datetime?: string;
  notes?: string;
}

export interface ScheduleFilters {
  user?: number;
  room?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
}

// Servicio de turnos con middleware suave (no desloguea automáticamente)
const softScheduleService = {
  // Obtener todos los turnos
  async getSchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.user) params.append('user', filters.user.toString());
      if (filters?.room) params.append('room', filters.room.toString());
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const endpoint = `/api/schedule/schedules/${queryString ? `?${queryString}` : ''}`;
      
      return await softAuthenticatedOnly(
        () => apiClient.get<Schedule[]>(endpoint),
        'obtener turnos'
      ) as Schedule[];
    } catch (error) {
      console.error('Error getting schedules:', error);
      throw error;
    }
  },

  // Obtener turno por ID
  async getSchedule(id: number): Promise<Schedule> {
    try {
      return await softAuthenticatedOnly(
        () => apiClient.get<Schedule>(`/api/schedule/schedules/${id}/`),
        'obtener turno'
      ) as Schedule;
    } catch (error) {
      console.error('Error getting schedule:', error);
      throw error;
    }
  },

  // Crear turno
  async createSchedule(scheduleData: CreateScheduleData): Promise<Schedule> {
    try {
      return await softAdminOnly(
        () => apiClient.post<CreateScheduleData, Schedule>('/api/schedule/schedules/', scheduleData),
        'crear turnos'
      ) as Schedule;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  // Actualizar turno (versión suave)
  async updateSchedule(id: number, scheduleData: UpdateScheduleData): Promise<Schedule> {
    try {
      return await softAdminOnly(
        () => apiClient.patch(`/api/schedule/schedules/${id}/`, scheduleData),
        'editar turnos'
      ) as Schedule;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  },

  // Eliminar turno
  async deleteSchedule(id: number): Promise<void> {
    try {
      await softAdminOnly(
        () => apiClient.delete(`/api/schedule/schedules/${id}/`),
        'eliminar turnos'
      );
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  },

  // Obtener turnos del usuario actual
  async getMySchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const endpoint = `/api/schedule/schedules/my/${queryString ? `?${queryString}` : ''}`;
      
      return await softAuthenticatedOnly(
        () => apiClient.get<Schedule[]>(endpoint),
        'obtener mis turnos'
      ) as Schedule[];
    } catch (error) {
      console.error('Error getting my schedules:', error);
      throw error;
    }
  },

  // Obtener turnos actuales del usuario
  async getCurrentSchedules(): Promise<Schedule[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getMySchedules({
        date_from: today,
        date_to: today
      });
    } catch (error) {
      console.error('Error getting current schedules:', error);
      throw error;
    }
  },

  // Validar acceso a sala
  async validateRoomAccess(roomId: number, userId?: number, accessDatetime?: string): Promise<{
    access_granted: boolean;
    reason?: string;
    schedule?: unknown;
  }> {
    try {
      const body: { room_id: number; user_id?: number; access_datetime?: string } = { room_id: roomId };
      if (userId) body.user_id = userId;
      if (accessDatetime) body.access_datetime = accessDatetime;

      return await softAuthenticatedOnly(
        () => apiClient.post('/api/schedule/schedules/validate_room_access/', body),
        'validar acceso a sala'
      );
    } catch (error) {
      console.error('Error validating room access:', error);
      throw error;
    }
  },

  // Verificar cumplimiento de turno
  async checkCompliance(scheduleId: number): Promise<{ compliant: boolean; details: string }> {
    try {
      return await softAuthenticatedOnly(
        () => apiClient.get(`/api/schedule/schedules/${scheduleId}/compliance/`),
        'verificar cumplimiento'
      ) as { compliant: boolean; details: string };
    } catch (error) {
      console.error('Error checking compliance:', error);
      throw error;
    }
  }
};

export default softScheduleService;


