/**
 * Servicio específico para reportes de monitores
 * Maneja endpoints y fallbacks para usuarios con rol 'monitor'
 */

import { apiClient } from '../utils/api';
import { getMyEntries } from './roomEntryService';
import scheduleService from './scheduleService';

interface MonitorStats {
  late_arrivals_count: number;
  total_assigned_hours: number;
  total_worked_hours: number;
  remaining_hours: number;
}

interface MonitorWorkedHours {
  total_worked_hours: number;
  total_assigned_hours: number;
  compliance_percentage: number;
  overlaps_found: Array<{
    entry_id: number;
    schedule_id: number;
    user: string;
    overlap_hours: number;
    entry_period: string;
    schedule_period: string;
  }>;
  user_hours: Record<string, number>;
  schedule_hours: Record<string, number>;
}

export const monitorReportsService = {
  /**
   * Obtener estadísticas del monitor
   */
  async getMonitorStats(params: URLSearchParams): Promise<MonitorStats> {
    // Los endpoints específicos para monitores no están disponibles en el backend
    // Usar directamente el cálculo local para evitar errores 404
    console.log('Calculando estadísticas básicas para monitor (endpoints específicos no disponibles)');
    return this.calculateBasicStats(params);
  },

  /**
   * Obtener horas trabajadas del monitor
   */
  async getMonitorWorkedHours(params: URLSearchParams): Promise<MonitorWorkedHours> {
    // Los endpoints específicos para monitores no están disponibles en el backend
    // Usar directamente el cálculo local para evitar errores 404
    console.log('Calculando horas trabajadas básicas para monitor (endpoints específicos no disponibles)');
    return this.calculateBasicWorkedHours(params);
  },

  /**
   * Obtener schedules del monitor
   */
  async getMonitorSchedules(params: URLSearchParams, userId: number): Promise<unknown[]> {
    try {
      const dateFrom = params.get('from_date');
      const dateTo = params.get('to_date');

      // Usar endpoint específico para monitores
      const response = await apiClient.get(`/api/schedule/my-schedules/?date_from=${dateFrom || ''}&date_to=${dateTo || ''}`);
      console.log('Schedules del monitor obtenidos desde backend:', response);
      
      // El endpoint devuelve un objeto con diferentes estructuras posibles
      if (response) {
        // Estructura 1: response.schedules
        if (response.schedules && Array.isArray(response.schedules)) {
          return response.schedules;
        }
        
        // Estructura 2: response.past_schedules + response.current_schedules + response.upcoming_schedules
        if (response.past_schedules || response.current_schedules || response.upcoming_schedules) {
          const allSchedules = [
            ...(response.past_schedules || []),
            ...(response.current_schedules || []),
            ...(response.upcoming_schedules || [])
          ];
          return allSchedules;
        }
        
        // Estructura 3: response es directamente un array
        if (Array.isArray(response)) {
          return response;
        }
      }
      
      return [];
    } catch (error) {
      console.warn('Error obteniendo schedules del monitor desde backend, usando fallback:', error);
      
      // Fallback: usar scheduleService
      try {
        const dateFrom = params.get('from_date');
        const dateTo = params.get('to_date');
        const roomId = params.get('room_id');

        return await scheduleService.getSchedules({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          room: roomId ? parseInt(roomId) : undefined,
          user: userId
        });
      } catch (fallbackError) {
        console.warn('Error en fallback de schedules:', fallbackError);
        return [];
      }
    }
  },

  /**
   * Obtener entries del monitor
   */
  async getMonitorEntries(params?: URLSearchParams): Promise<unknown[]> {
    try {
      // Usar endpoint específico para monitores con filtros
      const queryParams = params ? `?${params.toString()}` : '';
      const response = await apiClient.get(`/api/rooms/my-entries/${queryParams}`);
      console.log('Entries del monitor obtenidos desde backend:', response);
      
      // El endpoint devuelve un objeto con entries
      if (response) {
        // Estructura 1: response.entries
        if (response.entries && Array.isArray(response.entries)) {
          return response.entries;
        }
        
        // Estructura 2: response es directamente un array
        if (Array.isArray(response)) {
          return response;
        }
      }
      
      return [];
    } catch (error) {
      console.warn('Error obteniendo entries del monitor desde backend, usando fallback:', error);
      
      // Fallback: usar getMyEntries sin filtros (el endpoint no soporta filtros)
      try {
        return await getMyEntries();
      } catch (fallbackError) {
        console.warn('Error en fallback de entries:', fallbackError);
        return [];
      }
    }
  },

  /**
   * Calcular estadísticas básicas desde datos del usuario
   */
  async calculateBasicStats(params: URLSearchParams): Promise<MonitorStats> {
    try {
      console.log('Calculando estadísticas básicas para monitor...');
      
      // Obtener datos básicos del usuario
      const [schedules, entries] = await Promise.all([
        this.getMonitorSchedules(params, parseInt(params.get('user_id') || '0')),
        this.getMonitorEntries()
      ]);

      console.log('Datos obtenidos:', { schedules: schedules.length, entries: entries.length });

      // Filtrar por fechas y sala si están especificadas
      const dateFrom = params.get('from_date');
      const dateTo = params.get('to_date');
      const roomId = params.get('room_id');
      
      let filteredSchedules = schedules;
      let filteredEntries = entries;

      if (dateFrom || dateTo) {
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        filteredSchedules = schedules.filter((schedule: unknown) => {
          const scheduleDate = new Date(schedule.start_time);
          if (fromDate && scheduleDate < fromDate) return false;
          if (toDate && scheduleDate > toDate) return false;
          return true;
        });

        filteredEntries = entries.filter((entry: unknown) => {
          const entryDate = new Date(entry.startedAt);
          if (fromDate && entryDate < fromDate) return false;
          if (toDate && entryDate > toDate) return false;
          return true;
        });
      }

      // ✅ APLICAR FILTRO POR SALA SI ESTÁ ESPECIFICADA
      if (roomId) {
        const roomIdNum = parseInt(roomId);
        
        filteredSchedules = filteredSchedules.filter((schedule: unknown) => {
          const scheduleRoomId = schedule.room_id || schedule.room || schedule.roomId;
          return scheduleRoomId && scheduleRoomId === roomIdNum;
        });

        filteredEntries = filteredEntries.filter((entry: unknown) => {
          const entryRoomId = entry.room_id || entry.room || entry.roomId;
          return entryRoomId && entryRoomId === roomIdNum;
        });
      }

      console.log('Datos filtrados:', { schedules: filteredSchedules.length, entries: filteredEntries.length });

      // Calcular llegadas tarde (comparar entrada con schedule)
      const lateArrivals = filteredEntries.filter((entry: unknown) => {
        const entryTime = new Date(
          entry.entry_time || 
          entry.startedAt || 
          entry.created_at || 
          entry.date
        );
        
        if (isNaN(entryTime.getTime())) return false;
        
        // Buscar schedule correspondiente por fecha y hora aproximada
        const correspondingSchedule = filteredSchedules.find((schedule: unknown) => {
          const scheduleTime = new Date(
            schedule.start_datetime || 
            schedule.start_time || 
            schedule.date || 
            schedule.created_at
          );
          
          if (isNaN(scheduleTime.getTime())) return false;
          
          const timeDiff = Math.abs(entryTime.getTime() - scheduleTime.getTime());
          // Considerar que es el mismo turno si la diferencia es menor a 2 horas
          return timeDiff < 2 * 60 * 60 * 1000;
        });

        if (correspondingSchedule) {
          const scheduleTime = new Date(
            correspondingSchedule.start_datetime || 
            correspondingSchedule.start_time || 
            correspondingSchedule.date || 
            correspondingSchedule.created_at
          );
          
          if (isNaN(scheduleTime.getTime())) return false;
          
          // Considerar tarde si llega más de 5 minutos después
          return entryTime.getTime() - scheduleTime.getTime() > 5 * 60 * 1000;
        }
        
        return false;
      }).length;

      // Calcular horas asignadas (desde schedules)
      const totalAssignedHours = filteredSchedules.reduce((total: number, schedule: unknown) => {
        const startTime = schedule.start_datetime || schedule.start_time || schedule.date;
        const endTime = schedule.end_datetime || schedule.end_time;
        
        if (startTime && endTime) {
          const start = new Date(startTime);
          const end = new Date(endTime);
          
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + Math.max(0, hours);
          }
        }
        return total;
      }, 0);

      // Calcular horas trabajadas (desde entries)
      const totalWorkedHours = filteredEntries.reduce((total: number, entry: unknown) => {
        const startTime = entry.entry_time || entry.startedAt || entry.created_at;
        const endTime = entry.exit_time || entry.endedAt;
        
        if (startTime && endTime) {
          const start = new Date(startTime);
          const end = new Date(endTime);
          
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + Math.max(0, hours);
          }
        }
        return total;
      }, 0);

      const remainingHours = Math.max(0, totalAssignedHours - totalWorkedHours);

      console.log('Estadísticas calculadas:', {
        lateArrivals,
        totalAssignedHours,
        totalWorkedHours,
        remainingHours
      });

      return {
        late_arrivals_count: lateArrivals,
        total_assigned_hours: totalAssignedHours,
        total_worked_hours: totalWorkedHours,
        remaining_hours: remainingHours
      };
    } catch (error) {
      console.warn('Error calculando estadísticas básicas:', error);
      return {
        late_arrivals_count: 0,
        total_assigned_hours: 0,
        total_worked_hours: 0,
        remaining_hours: 0
      };
    }
  },

  /**
   * Calcular horas trabajadas básicas
   */
  async calculateBasicWorkedHours(params: URLSearchParams): Promise<MonitorWorkedHours> {
    try {
      console.log('Calculando horas trabajadas básicas para monitor...');
      
      const entries = await this.getMonitorEntries();
      const schedules = await this.getMonitorSchedules(params, parseInt(params.get('user_id') || '0'));

      console.log('Datos para horas trabajadas:', { entries: entries.length, schedules: schedules.length });

      // Filtrar por fechas y sala si están especificadas
      const dateFrom = params.get('from_date');
      const dateTo = params.get('to_date');
      const roomId = params.get('room_id');
      
      let filteredSchedules = schedules;
      let filteredEntries = entries;

      if (dateFrom || dateTo) {
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        filteredSchedules = schedules.filter((schedule: unknown) => {
          // Manejar diferentes formatos de fecha en schedules
          const scheduleDate = new Date(
            schedule.start_datetime || 
            schedule.start_time || 
            schedule.date || 
            schedule.created_at
          );
          if (fromDate && scheduleDate < fromDate) return false;
          if (toDate && scheduleDate > toDate) return false;
          return true;
        });

        filteredEntries = entries.filter((entry: unknown) => {
          // Manejar diferentes formatos de fecha en entries
          const entryDate = new Date(
            entry.entry_time || 
            entry.startedAt || 
            entry.created_at || 
            entry.date
          );
          if (fromDate && entryDate < fromDate) return false;
          if (toDate && entryDate > toDate) return false;
          return true;
        });
      }

      // ✅ APLICAR FILTRO POR SALA SI ESTÁ ESPECIFICADA
      if (roomId) {
        const roomIdNum = parseInt(roomId);
        
        filteredSchedules = filteredSchedules.filter((schedule: unknown) => {
          const scheduleRoomId = schedule.room_id || schedule.room || schedule.roomId;
          return scheduleRoomId && scheduleRoomId === roomIdNum;
        });

        filteredEntries = filteredEntries.filter((entry: unknown) => {
          const entryRoomId = entry.room_id || entry.room || entry.roomId;
          return entryRoomId && entryRoomId === roomIdNum;
        });
      }

      const totalWorkedHours = filteredEntries.reduce((total: number, entry: unknown) => {
        const startTime = entry.entry_time || entry.startedAt || entry.created_at;
        const endTime = entry.exit_time || entry.endedAt;
        
        if (startTime && endTime) {
          const start = new Date(startTime);
          const end = new Date(endTime);
          
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + Math.max(0, hours);
          }
        }
        return total;
      }, 0);

      const totalAssignedHours = filteredSchedules.reduce((total: number, schedule: unknown) => {
        const startTime = schedule.start_datetime || schedule.start_time || schedule.date;
        const endTime = schedule.end_datetime || schedule.end_time;
        
        if (startTime && endTime) {
          const start = new Date(startTime);
          const end = new Date(endTime);
          
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + Math.max(0, hours);
          }
        }
        return total;
      }, 0);

      // Calcular horas por usuario (solo el monitor actual)
      const userHours: Record<string, number> = {};
      const userId = params.get('user_id');
      if (userId) {
        userHours[userId] = totalWorkedHours;
      }

      // Calcular horas por schedule
      const scheduleHours: Record<string, number> = {};
      filteredSchedules.forEach((schedule: unknown) => {
        if (schedule.start_time && schedule.end_time) {
          const start = new Date(schedule.start_time);
          const end = new Date(schedule.end_time);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          scheduleHours[schedule.id] = Math.max(0, hours);
        }
      });

      console.log('Horas trabajadas calculadas:', {
        totalWorkedHours,
        totalAssignedHours,
        compliancePercentage: totalAssignedHours > 0 ? (totalWorkedHours / totalAssignedHours) * 100 : 0
      });

      return {
        total_worked_hours: totalWorkedHours,
        total_assigned_hours: totalAssignedHours,
        compliance_percentage: totalAssignedHours > 0 ? (totalWorkedHours / totalAssignedHours) * 100 : 0,
        overlaps_found: [],
        user_hours: userHours,
        schedule_hours: scheduleHours
      };
    } catch (error) {
      console.warn('Error calculando horas trabajadas básicas:', error);
      return {
        total_worked_hours: 0,
        total_assigned_hours: 0,
        compliance_percentage: 0,
        overlaps_found: [],
        user_hours: {},
        schedule_hours: {}
      };
    }
  }
};

export default monitorReportsService;
