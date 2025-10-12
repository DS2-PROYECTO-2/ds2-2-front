import { apiClient } from '../utils/api';

// Interfaces para el servicio de acceso a salas
export interface RoomAccessRequest {
  room_id: number;
  access_type: 'entry' | 'exit';
  access_datetime?: string;
}

export interface RoomAccessValidation {
  access_granted: boolean;
  reason?: string;
  schedule?: {
    id: number;
    start_datetime: string;
    end_datetime: string;
    room_name?: string;
  };
  details?: {
    room_id: number;
    user_id: number;
    access_time: string;
  };
}

export interface RoomAccessResult {
  success: boolean;
  message: string;
  data?: {
    id: number;
    room: number;
    entry_time: string;
    exit_time?: string;
  };
}

export interface RoomAccessInfo {
  canAccess: boolean;
  reason?: string;
  schedule?: {
    id: number;
    start_datetime: string;
    end_datetime: string;
    room_name?: string;
  };
}

export interface ScheduleInfo {
  hasActiveSchedule: boolean;
  message: string;
  schedule?: {
    id: number;
    start_datetime: string;
    end_datetime: string;
    room_name?: string;
    user_id: number;
  };
}

// Servicio de acceso a salas
class RoomAccessService {
  // Validar acceso a sala
  async validateRoomAccess(request: RoomAccessRequest): Promise<RoomAccessValidation> {
    try {
      const response = await apiClient.post<RoomAccessRequest, RoomAccessValidation>('/schedule/schedules/validate_room_access/', request);
      return response;
    } catch (error: unknown) {
      console.error('Error validating room access:', error);
      return {
        access_granted: false,
        reason: 'Error al validar acceso'
      };
    }
  }

  // Registrar entrada a sala
  async registerRoomEntry(roomId: number, entryTime?: string): Promise<RoomAccessResult> {
    try {
      const response = await apiClient.post<{room: number; entry_time?: string}, {id: number; room: number; entry_time: string}>('/rooms/entry/', {
        room: roomId,
        entry_time: entryTime
      });
      return {
        success: true,
        message: 'Entrada registrada exitosamente',
        data: response
      };
    } catch (error: unknown) {
      console.error('Error registering room entry:', error);
      return {
        success: false,
        message: 'Error al registrar entrada'
      };
    }
  }

  // Registrar salida de sala
  async registerRoomExit(roomId: number, exitTime?: string): Promise<RoomAccessResult> {
    try {
      const response = await apiClient.patch<{exit_time?: string}, {id: number; room: number; entry_time: string; exit_time: string}>(`/rooms/entry/${roomId}/exit/`, {
        exit_time: exitTime
      });
      return {
        success: true,
        message: 'Salida registrada exitosamente',
        data: response
      };
    } catch (error: unknown) {
      console.error('Error registering room exit:', error);
      return {
        success: false,
        message: 'Error al registrar salida'
      };
    }
  }

  // Verificar si puede acceder a una sala
  async canAccessRoom(roomId: number): Promise<RoomAccessInfo> {
    try {
      const response = await apiClient.get<RoomAccessInfo>(`/rooms/${roomId}/access/`);
      return response;
    } catch (error: unknown) {
      console.error('Error checking room access:', error);
      return {
        canAccess: false,
        reason: 'Error al verificar acceso'
      };
    }
  }

  // Obtener turnos activos
  async getActiveSchedules(): Promise<Array<{
    id: number;
    start_datetime: string;
    end_datetime: string;
    room_name?: string;
    user_id: number;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        id: number;
        start_datetime: string;
        end_datetime: string;
        room_name?: string;
        user_id: number;
      }>>('/schedule/schedules/my_schedules/');
      return response;
    } catch (error: unknown) {
      console.error('Error getting active schedules:', error);
      return [];
    }
  }

  // Obtener información del turno actual
  async getCurrentScheduleInfo(): Promise<ScheduleInfo> {
    try {
      const schedules = await this.getActiveSchedules();
      const currentTime = new Date();
      
      const activeSchedule = schedules.find(schedule => {
        const start = new Date(schedule.start_datetime);
        const end = new Date(schedule.end_datetime);
        return currentTime >= start && currentTime <= end;
      });

      if (activeSchedule) {
        return {
          hasActiveSchedule: true,
          message: `Tienes un turno activo en ${activeSchedule.room_name || 'la sala asignada'}`,
          schedule: activeSchedule
        };
      } else {
        return {
          hasActiveSchedule: false,
          message: 'No tienes un turno activo en este momento'
        };
      }
    } catch (error: unknown) {
      return {
        hasActiveSchedule: false,
        message: 'Error al obtener información del turno'
      };
    }
  }
}

// Exportar instancia del servicio
const roomAccessService = new RoomAccessService();
export default roomAccessService;