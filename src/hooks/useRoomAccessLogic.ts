import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRoomAccess } from './useRoomAccess';

// Interfaz para el estado de acceso
interface AccessState {
  hasAccess: boolean;
  reason: string;
  currentSchedule: {
    id: number;
    start_datetime: string;
    end_datetime: string;
    room: number;
    room_name?: string;
  } | null;
  isInRoom: boolean;
  lastEntryTime: string | null;
  lastExitTime: string | null;
}

export const useRoomAccessLogic = (roomId: number) => {
  const { user } = useAuth();
  const { 
    validateAccess, 
    registerEntry, 
    registerExit, 
    canAccessRoom,
    getCurrentScheduleInfo,
    isValidating 
  } = useRoomAccess();

  const [accessState, setAccessState] = useState<AccessState>({
    hasAccess: false,
    reason: '',
    currentSchedule: null,
    isInRoom: false,
    lastEntryTime: null,
    lastExitTime: null
  });

  // Verificar acceso a la sala
  const checkAccess = useCallback(async () => {
    if (!user || user.role !== 'monitor') {
      setAccessState(prev => ({
        ...prev,
        hasAccess: false,
        reason: 'Solo los monitores pueden acceder a salas'
      }));
      return;
    }

    try {
      const accessInfo = await canAccessRoom(roomId);
      setAccessState(prev => ({
        ...prev,
        hasAccess: accessInfo.canAccess,
        reason: accessInfo.reason || 'Sin información',
        currentSchedule: accessInfo.schedule ? {
          ...accessInfo.schedule,
          room: roomId
        } : null
      }));
    } catch (error) {
      console.error('Error checking room access:', error);
      setAccessState(prev => ({
        ...prev,
        hasAccess: false,
        reason: 'Error al verificar acceso'
      }));
    }
  }, [user, roomId, canAccessRoom]);

  // Verificar acceso inicial
  useEffect(() => {
    if (user && user.role === 'monitor' && roomId) {
      checkAccess();
    }
  }, [user, roomId, checkAccess]);

  // Intentar entrar a la sala (usando validación del backend)
  const attemptEntry = useCallback(async (entryTime?: string) => {
    if (!user || user.role !== 'monitor') {
      return {
        success: false,
        message: 'Solo los monitores pueden acceder a salas'
      };
    }

    try {
      // PRIMERO: Validar acceso usando el backend
      const validation = await validateAccess(roomId, 'entry', entryTime);
      
      if (!validation.access_granted) {
        setAccessState(prev => ({
          ...prev,
          hasAccess: false,
          reason: validation.reason || 'Acceso denegado'
        }));
        
        return {
          success: false,
          message: validation.reason || 'Acceso denegado'
        };
      }

      // SEGUNDO: Registrar entrada (el backend ya validó todo)
      const result = await registerEntry(roomId, entryTime);
      
      if (result.success) {
        setAccessState(prev => ({
          ...prev,
          hasAccess: true,
          isInRoom: true,
          lastEntryTime: entryTime || new Date().toISOString(),
          reason: 'Entrada autorizada'
        }));
      }

      return result;
    } catch (error) {
      console.error('Error attempting room entry:', error);
      return {
        success: false,
        message: 'Error al procesar entrada'
      };
    }
  }, [user, roomId, validateAccess, registerEntry]);

  // Salir de la sala
  const attemptExit = useCallback(async (exitTime?: string) => {
    if (!user || user.role !== 'monitor') {
      return {
        success: false,
        message: 'Solo los monitores pueden acceder a salas'
      };
    }

    try {
      // La salida no tiene restricciones
      const result = await registerExit(roomId, exitTime);
      
      if (result.success) {
        setAccessState(prev => ({
          ...prev,
          hasAccess: false,
          isInRoom: false,
          lastExitTime: exitTime || new Date().toISOString(),
          reason: 'Salida registrada'
        }));
      }

      return result;
    } catch (error) {
      console.error('Error attempting room exit:', error);
      return {
        success: false,
        message: 'Error al procesar salida'
      };
    }
  }, [user, roomId, registerExit]);

  // Verificar si tiene turno en esta sala
  const hasScheduleInRoom = useCallback(async (): Promise<boolean> => {
    try {
      const accessInfo = await canAccessRoom(roomId);
      return accessInfo.canAccess;
    } catch (error) {
      console.error('Error checking schedule in room:', error);
      return false;
    }
  }, [roomId, canAccessRoom]);

  // Obtener información del turno actual
  const getScheduleInfo = useCallback(async () => {
    try {
      const scheduleInfo = await getCurrentScheduleInfo();
      return scheduleInfo;
    } catch (error) {
      console.error('Error getting schedule info:', error);
      return {
        hasActiveSchedule: false,
        message: 'Error al obtener información del turno'
      };
    }
  }, [getCurrentScheduleInfo]);

  // Validar acceso en tiempo real
  const validateRealTimeAccess = useCallback(async () => {
    if (!user || user.role !== 'monitor') {
      return;
    }

    try {
      const validation = await validateAccess(roomId, 'entry');
      setAccessState(prev => ({
        ...prev,
        hasAccess: validation.access_granted,
        reason: validation.reason || '',
        currentSchedule: validation.schedule ? {
          ...validation.schedule,
          room: roomId
        } : null
      }));
    } catch (error) {
      console.error('Error validating real-time access:', error);
    }
  }, [user, roomId, validateAccess]);

  // Verificar si puede acceder ahora mismo
  const canAccessNow = useCallback(async (): Promise<{ canAccess: boolean; reason: string; schedule?: {
    id: number;
    start_datetime: string;
    end_datetime: string;
    room: number;
    room_name?: string;
  } }> => {
    try {
      const accessInfo = await canAccessRoom(roomId);
      return {
        canAccess: accessInfo.canAccess,
        reason: accessInfo.reason || 'Sin información',
        schedule: accessInfo.schedule ? {
          ...accessInfo.schedule,
          room: roomId
        } : undefined
      };
    } catch (error) {
      console.error('Error checking current access:', error);
      return {
        canAccess: false,
        reason: 'Error al verificar acceso'
      };
    }
  }, [roomId, canAccessRoom]);

  // Obtener turnos activos del monitor
  const getActiveSchedules = useCallback(async () => {
    try {
      const scheduleInfo = await getCurrentScheduleInfo();
      return scheduleInfo;
    } catch (error) {
      console.error('Error getting active schedules:', error);
      return {
        hasActiveSchedule: false,
        message: 'Error al obtener turnos activos'
      };
    }
  }, [getCurrentScheduleInfo]);

  return {
    // Estado
    accessState,
    isValidating,
    
    // Funciones
    checkAccess,
    attemptEntry,
    attemptExit,
    hasScheduleInRoom,
    getScheduleInfo,
    validateRealTimeAccess,
    canAccessNow,
    getActiveSchedules,
    
    // Estado derivado
    hasAccess: accessState.hasAccess,
    isInRoom: accessState.isInRoom,
    currentSchedule: accessState.currentSchedule,
    accessReason: accessState.reason
  };
};
