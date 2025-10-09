import React, { useEffect } from 'react';
import { useRoomAccess } from '../../hooks/useRoomAccess';
import { useAuth } from '../../hooks/useAuth';

interface RoomAccessControllerProps {
  roomId: number;
  onAccessChange?: (hasAccess: boolean, reason: string) => void;
  onScheduleInfo?: (scheduleInfo: any) => void;
}

const RoomAccessController: React.FC<RoomAccessControllerProps> = ({
  roomId,
  onAccessChange,
  onScheduleInfo
}) => {
  const { user } = useAuth();
  const { 
    validateAccess, 
    registerEntry, 
    registerExit, 
    canAccessRoom,
    getCurrentScheduleInfo
  } = useRoomAccess();

  // Validar acceso inicial
  useEffect(() => {
    if (user && roomId) {
      checkRoomAccess();
    }
  }, [user, roomId]);

  // Verificar acceso a la sala
  const checkRoomAccess = async () => {
    if (!user || user.role !== 'monitor') {
      return;
    }

    try {
      const accessInfo = await canAccessRoom(roomId);
      
      if (onAccessChange) {
        onAccessChange(accessInfo.canAccess, accessInfo.reason || '');
      }
    } catch (error) {
      console.error('Error checking room access:', error);
      if (onAccessChange) {
        onAccessChange(false, 'Error al verificar acceso');
      }
    }
  };

  // Obtener información del turno actual
  const getScheduleInfo = async () => {
    try {
      const scheduleInfo = await getCurrentScheduleInfo();
      
      if (onScheduleInfo) {
        onScheduleInfo(scheduleInfo);
      }
    } catch (error) {
      console.error('Error getting schedule info:', error);
    }
  };

  // Manejar entrada a sala (usando validación del backend)
  const handleRoomEntry = async (entryTime?: string) => {
    if (!user || user.role !== 'monitor') {
      return { success: false, message: 'Solo los monitores pueden acceder a salas' };
    }

    try {
      // PRIMERO: Validar acceso usando el backend (incluye todas las validaciones)
      const validation = await validateAccess(roomId, 'entry', entryTime);
      
      if (!validation.access_granted) {
        if (onAccessChange) {
          onAccessChange(false, validation.reason || 'Acceso denegado');
        }
        
        return {
          success: false,
          message: validation.reason || 'Acceso denegado'
        };
      }

      // SEGUNDO: Registrar entrada (el backend ya validó todo)
      const result = await registerEntry(roomId, entryTime);
      
      if (result.success) {
        if (onAccessChange) {
          onAccessChange(true, 'Entrada autorizada');
        }
        
        // Obtener información del turno
        await getScheduleInfo();
      }

      return result;
    } catch (error) {
      console.error('Error handling room entry:', error);
      return {
        success: false,
        message: 'Error al procesar entrada'
      };
    }
  };

  // Manejar salida de sala
  const handleRoomExit = async (exitTime?: string) => {
    if (!user || user.role !== 'monitor') {
      return { success: false, message: 'Solo los monitores pueden acceder a salas' };
    }

    try {
      // La salida no tiene restricciones
      const result = await registerExit(roomId, exitTime);
      
      if (result.success) {
        if (onAccessChange) {
          onAccessChange(false, 'Salida registrada');
        }
      }

      return result;
    } catch (error) {
      console.error('Error handling room exit:', error);
      return {
        success: false,
        message: 'Error al procesar salida'
      };
    }
  };

  // Validar acceso en tiempo real
  const validateRealTimeAccess = async () => {
    if (!user || user.role !== 'monitor') {
      return;
    }

    try {
      const validation = await validateAccess(roomId, 'entry');
      
      if (onAccessChange) {
        onAccessChange(validation.access_granted, validation.reason || '');
      }
    } catch (error) {
      console.error('Error validating real-time access:', error);
    }
  };

  // Verificar si el monitor tiene turno en esta sala
  const hasScheduleInRoom = async (): Promise<boolean> => {
    try {
      const accessInfo = await canAccessRoom(roomId);
      return accessInfo.canAccess;
    } catch (error) {
      console.error('Error checking schedule in room:', error);
      return false;
    }
  };

  // Obtener turnos del monitor para esta sala
  const getSchedulesForRoom = async () => {
    try {
      const activeSchedules = await getCurrentScheduleInfo();
      return activeSchedules;
    } catch (error) {
      console.error('Error getting schedules for room:', error);
      return null;
    }
  };

  // Exponer funciones para uso externo
  const ref = React.useRef<any>(null);
  React.useImperativeHandle(ref, () => ({
    checkRoomAccess,
    handleRoomEntry,
    handleRoomExit,
    validateRealTimeAccess,
    hasScheduleInRoom,
    getSchedulesForRoom,
    getScheduleInfo
  }));

  return null; // Este componente no renderiza nada, solo maneja lógica
};

export default RoomAccessController;
