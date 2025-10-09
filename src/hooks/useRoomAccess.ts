import { useState, useCallback } from 'react';
import roomAccessService from '../services/roomAccessService';
import type { RoomAccessRequest, RoomAccessValidation } from '../services/roomAccessService';
import { parseRoomAccessError, getErrorMessage } from '../utils/roomAccessErrors';

export const useRoomAccess = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<RoomAccessValidation | null>(null);

  // Validar acceso a sala
  const validateAccess = useCallback(async (roomId: number, accessType: 'entry' | 'exit', accessTime?: string): Promise<RoomAccessValidation> => {
    setIsValidating(true);
    
    try {
      const request: RoomAccessRequest = {
        room_id: roomId,
        access_type: accessType,
        access_datetime: accessTime
      };

      const validation = await roomAccessService.validateRoomAccess(request);
      setLastValidation(validation);
      return validation;
    } catch (error) {
      console.error('Error validating room access:', error);
      const errorValidation: RoomAccessValidation = {
        access_granted: false,
        reason: 'Error al validar acceso'
      };
      setLastValidation(errorValidation);
      return errorValidation;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Registrar entrada
  const registerEntry = useCallback(async (roomId: number, entryTime?: string) => {
    try {
      const result = await roomAccessService.registerRoomEntry(roomId, entryTime);
      return result;
    } catch (error: any) {
      console.error('Error registering entry:', error);
      
      // Parsear y manejar errores específicos
      const parsedError = parseRoomAccessError(error);
      return {
        success: false,
        message: getErrorMessage(parsedError)
      };
    }
  }, []);

  // Registrar salida
  const registerExit = useCallback(async (roomId: number, exitTime?: string) => {
    try {
      const result = await roomAccessService.registerRoomExit(roomId, exitTime);
      return result;
    } catch (error) {
      console.error('Error registering exit:', error);
      return {
        success: false,
        message: 'Error al registrar salida'
      };
    }
  }, []);

  // Verificar si puede acceder a una sala
  const canAccessRoom = useCallback(async (roomId: number) => {
    try {
      const result = await roomAccessService.canAccessRoom(roomId);
      return result;
    } catch (error) {
      console.error('Error checking room access:', error);
      return {
        canAccess: false,
        reason: 'Error al verificar acceso'
      };
    }
  }, []);

  // Obtener turnos activos
  const getActiveSchedules = useCallback(async () => {
    try {
      const schedules = await roomAccessService.getActiveSchedules();
      return schedules;
    } catch (error) {
      console.error('Error getting active schedules:', error);
      return [];
    }
  }, []);

  // Obtener información del turno actual
  const getCurrentScheduleInfo = useCallback(async () => {
    try {
      const info = await roomAccessService.getCurrentScheduleInfo();
      return info;
    } catch (error) {
      console.error('Error getting current schedule info:', error);
      return {
        hasActiveSchedule: false,
        message: 'Error al obtener información del turno'
      };
    }
  }, []);

  return {
    validateAccess,
    registerEntry,
    registerExit,
    canAccessRoom,
    getActiveSchedules,
    getCurrentScheduleInfo,
    isValidating,
    lastValidation
  };
};
