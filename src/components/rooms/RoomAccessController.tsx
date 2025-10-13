import React, { useEffect, useCallback } from 'react';
import { useRoomAccess } from '../../hooks/useRoomAccess';
import { useAuth } from '../../hooks/useAuth';

interface RoomAccessControllerProps {
  roomId: number;
  onAccessChange?: (hasAccess: boolean, reason: string) => void;
  onScheduleInfo?: (scheduleInfo: {
    id: number;
    start_datetime: string;
    end_datetime: string;
    room: number;
    room_name?: string;
  }) => void;
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

  // Verificar acceso a la sala
  const checkRoomAccess = useCallback(async () => {
    if (!user || user.role !== 'monitor') {
      return;
    }

    try {
      const accessInfo = await canAccessRoom(roomId);
      
      if (onAccessChange) {
        onAccessChange(accessInfo.canAccess, accessInfo.reason || '');
      }
    } catch {
      if (onAccessChange) {
        onAccessChange(false, 'Error al verificar acceso');
      }
    }
  }, [user, roomId, onAccessChange, canAccessRoom]);

  // Validar acceso inicial
  useEffect(() => {
    if (user && roomId) {
      checkRoomAccess();
    }
  }, [user, roomId, checkRoomAccess]);

  // Obtener información del turno actual
  const getScheduleInfo = async () => {
    try {
      const scheduleInfo = await getCurrentScheduleInfo();
      
      if (onScheduleInfo && scheduleInfo) {
        onScheduleInfo({
          id: (scheduleInfo as unknown as Record<string, unknown>).id as number || 0,
          start_datetime: (scheduleInfo as unknown as Record<string, unknown>).start_datetime as string || '',
          end_datetime: (scheduleInfo as unknown as Record<string, unknown>).end_datetime as string || '',
          room: roomId,
          room_name: (scheduleInfo as unknown as Record<string, unknown>).room_name as string
        });
      }
    } catch {
      // Error getting schedule info
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
    } catch {
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
    } catch {
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
    } catch {
      // Error validating real-time access
    }
  };

  // Verificar si el monitor tiene turno en esta sala
  const hasScheduleInRoom = async (): Promise<boolean> => {
    try {
      const accessInfo = await canAccessRoom(roomId);
      return accessInfo.canAccess;
    } catch {
      return false;
    }
  };

  // Obtener turnos del monitor para esta sala
  const getSchedulesForRoom = async () => {
    try {
      const activeSchedules = await getCurrentScheduleInfo();
      return activeSchedules;
    } catch {
      return null;
    }
  };

  // Exponer funciones para uso externo
  const ref = React.useRef<{
    checkRoomAccess: () => Promise<void>;
    handleRoomEntry: (entryTime?: string) => Promise<{ success: boolean; message: string }>;
    handleRoomExit: (exitTime?: string) => Promise<{ success: boolean; message: string }>;
    validateRealTimeAccess: () => Promise<void>;
    hasScheduleInRoom: () => Promise<boolean>;
    getSchedulesForRoom: () => Promise<unknown>;
    getScheduleInfo: () => Promise<void>;
  }>(null);
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
