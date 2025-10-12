import { apiClient } from '../utils/api';
import { adminOnly} from '../utils/securityMiddleware';

export interface Schedule {
  id: number;
  user: number;
  user_name?: string; // Campo opcional para compatibilidad
  room: number;
  room_name: string;
  start_datetime: string;
  end_datetime: string;
  status: 'active' | 'completed' | 'cancelled';
  recurring: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionales del endpoint detallado
  user_details?: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    phone: string;
  };
  room_details?: {
    id: number;
    name: string;
    code: string;
    capacity: number;
    description: string;
  };
  user_full_name?: string; // Campo principal para el nombre del usuario
  room_code?: string;
  duration_hours?: number;
  is_current?: boolean;
  is_upcoming?: boolean;
}

export interface CreateScheduleData {
  user: number;
  room: number;
  start_datetime: string;
  end_datetime: string;
  status?: 'active' | 'completed' | 'cancelled';
  recurring?: boolean;
  notes?: string;
}

export interface UpdateScheduleData {
  user?: number;
  room?: number;
  start_datetime?: string;
  end_datetime?: string;
  status?: 'active' | 'completed' | 'cancelled';
  recurring?: boolean;
  notes?: string;
}

export interface ScheduleFilters {
  date_from?: string;
  date_to?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'all';
  user?: number;
  room?: number;
}

export interface RoomAccessValidation {
  access_granted: boolean;
  schedule?: Schedule;
  reason?: string;
}

export interface ScheduleOverview {
  total_schedules: number;
  active_schedules: number;
  upcoming_schedules: number;
  compliance_rate: number;
  recent_schedules: Schedule[];
}

const scheduleService = {
  // Obtener todos los turnos
  async getSchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        params.append('date_to', filters.date_to);
      }
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters?.user) {
        params.append('user', filters.user.toString());
      }
      if (filters?.room) {
        params.append('room', filters.room.toString());
      }

      const url = `/api/schedule/schedules/?${params.toString()}`;
      
      const response = await apiClient.get(url) as { results: Schedule[] };
      
      // La API devuelve un objeto paginado con 'results' que contiene el array
      if (response && response.results && Array.isArray(response.results)) {
        return response.results as Schedule[];
      }
      
      // Fallback: si no tiene la estructura esperada, devolver array vacío
      return [];
    } catch (error) {
      throw error;
    }
  },

  // Obtener turno por ID
  async getScheduleById(id: number): Promise<Schedule> {
    try {
      const response = await apiClient.get(`/api/schedule/schedules/${id}/`);
      return response as Schedule;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo turno
  async createSchedule(scheduleData: CreateScheduleData): Promise<Schedule> {
    try {
      return await adminOnly(
        () => apiClient.post('/api/schedule/schedules/', scheduleData),
        'crear turnos'
      ) as Schedule;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar turno
  async updateSchedule(id: number, scheduleData: UpdateScheduleData): Promise<Schedule> {
    try {
      return await adminOnly(
        () => apiClient.patch(`/api/schedule/schedules/${id}/`, scheduleData),
        'editar turnos'
      ) as Schedule;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar turno
  async deleteSchedule(id: number): Promise<void> {
    try {
      await adminOnly(
        () => apiClient.delete(`/api/schedule/schedules/${id}/`),
        'eliminar turnos'
      );
    } catch (error) {
      throw error;
    }
  },

  // Obtener turnos próximos (7 días)
  async getUpcomingSchedules(): Promise<Schedule[]> {
    try {
      const response = await apiClient.get('/api/schedule/schedules/upcoming/');
      return response as Schedule[];
    } catch (error) {
      throw error;
    }
  },

  // Obtener turnos actuales (en curso)
  async getCurrentSchedules(): Promise<Schedule[]> {
    try {
      const response = await apiClient.get('/api/schedule/schedules/current/');
      return response as Schedule[];
    } catch (error) {
      throw error;
    }
  },

  // Validar acceso a sala
  async validateRoomAccess(roomId: number, userId?: number, accessDatetime?: string): Promise<RoomAccessValidation> {
    try {
      const body: { room_id: number; user_id?: number; access_datetime?: string } = { room_id: roomId };
      if (userId) body.user_id = userId;
      if (accessDatetime) body.access_datetime = accessDatetime;

      const response = await apiClient.post('/api/schedule/schedules/validate_room_access/', body);
      return response as RoomAccessValidation;
    } catch (error) {
      throw error;
    }
  },

  // Verificar cumplimiento de turno
  async checkCompliance(scheduleId: number): Promise<{ compliant: boolean; details: string }> {
    try {
      const response = await apiClient.post<Record<string, never>, { compliant: boolean; details: string }>(`/api/schedule/schedules/${scheduleId}/check_compliance/`, {});
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verificación masiva de cumplimiento
  async runComplianceCheck(): Promise<{ checked: number; compliant: number; non_compliant: number }> {
    try {
      const response = await apiClient.post<Record<string, never>, { checked: number; compliant: number; non_compliant: number }>('/api/schedule/schedules/run_compliance_check/', {});
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Mis turnos (para monitores)
  async getMySchedules(filters?: { date_from?: string; date_to?: string; status?: string }): Promise<{
    current: Schedule[];
    upcoming: Schedule[];
    past: Schedule[];
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters?.date_to) {
        params.append('date_to', filters.date_to);
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }

      const url = `/api/schedule/my-schedules/?${params.toString()}`;
      const response = await apiClient.get(url) as {
        current_schedules?: Schedule[];
        upcoming_schedules?: Schedule[];
        past_schedules?: Schedule[];
      };
      return {
        current: response.current_schedules || [],
        upcoming: response.upcoming_schedules || [],
        past: response.past_schedules || []
      };
    } catch (error) {
      throw error;
    }
  },

  // Mi turno actual
  async getMyCurrentSchedule(): Promise<{ has_current_schedule: boolean; current_schedule?: Schedule } | null> {
    try {
      const response = await apiClient.get('/api/schedule/my-current-schedule/');
      return response as { has_current_schedule: boolean; current_schedule?: Schedule } | null;
    } catch (error) {
      throw error;
    }
  },

  // Resumen general (para administradores)
  async getOverview(): Promise<ScheduleOverview> {
    try {
      const response = await apiClient.get('/api/schedule/admin/overview/');
      return response as ScheduleOverview;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar todos los turnos del sistema
  async deleteSchedulesByUser(userId: number): Promise<{ deleted_count: number }> {
    try {
      return await adminOnly(
        async () => {
          // Obtener todos los turnos del sistema
          const allSchedules = await scheduleService.getSchedules();
          
          // Filtrar turnos del usuario específico
          const userSchedules = allSchedules.filter(schedule => schedule.user === userId);
          
          // Eliminar cada turno del usuario individualmente
          let deletedCount = 0;
          for (const schedule of userSchedules) {
            await scheduleService.deleteSchedule(schedule.id);
            deletedCount++;
          }
          
          return { deleted_count: deletedCount };
        },
        'eliminar turnos del usuario'
      ) as { deleted_count: number };
    } catch (error) {
      throw error;
    }
  }
};

export default scheduleService;