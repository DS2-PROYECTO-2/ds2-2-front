// Utilidades para validación de horarios de turnos

export interface ScheduleTimeValidation {
  isValid: boolean;
  reason: string;
  timeUntilStart?: number; // minutos hasta que comience
  timeUntilEnd?: number; // minutos hasta que termine
  isActive?: boolean;
  isUpcoming?: boolean;
  isExpired?: boolean;
}

export const validateScheduleTime = (
  startTime: string | Date,
  endTime: string | Date,
  currentTime?: Date
): ScheduleTimeValidation => {
  const now = currentTime || new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Verificar que las fechas sean válidas
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      reason: 'Fechas de turno inválidas'
    };
  }
  
  // Verificar que el turno no haya terminado
  if (now > end) {
    return {
      isValid: false,
      reason: 'El turno ya ha terminado',
      isExpired: true
    };
  }
  
  // Verificar si el turno está activo
  if (now >= start && now <= end) {
    const timeUntilEnd = Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
    return {
      isValid: true,
      reason: 'Turno activo',
      isActive: true,
      timeUntilEnd
    };
  }
  
  // Verificar si el turno es próximo
  if (now < start) {
    const timeUntilStart = Math.floor((start.getTime() - now.getTime()) / (1000 * 60));
    return {
      isValid: false,
      reason: `El turno comienza en ${timeUntilStart} minutos`,
      isUpcoming: true,
      timeUntilStart
    };
  }
  
  return {
    isValid: false,
    reason: 'Estado de turno no válido'
  };
};

export const isScheduleActive = (
  startTime: string | Date,
  endTime: string | Date,
  currentTime?: Date
): boolean => {
  const validation = validateScheduleTime(startTime, endTime, currentTime);
  return validation.isValid && validation.isActive === true;
};

export const isScheduleUpcoming = (
  startTime: string | Date,
  endTime: string | Date,
  currentTime?: Date
): boolean => {
  const validation = validateScheduleTime(startTime, endTime, currentTime);
  return !validation.isValid && validation.isUpcoming === true;
};

export const isScheduleExpired = (
  startTime: string | Date,
  endTime: string | Date,
  currentTime?: Date
): boolean => {
  const validation = validateScheduleTime(startTime, endTime, currentTime);
  return !validation.isValid && validation.isExpired === true;
};

export const getTimeUntilScheduleStart = (
  startTime: string | Date,
  currentTime?: Date
): number => {
  const now = currentTime || new Date();
  const start = new Date(startTime);
  
  if (isNaN(start.getTime())) {
    return -1;
  }
  
  return Math.floor((start.getTime() - now.getTime()) / (1000 * 60));
};

export const getTimeUntilScheduleEnd = (
  endTime: string | Date,
  currentTime?: Date
): number => {
  const now = currentTime || new Date();
  const end = new Date(endTime);
  
  if (isNaN(end.getTime())) {
    return -1;
  }
  
  return Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
};

export const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 0) {
    return 'Tiempo agotado';
  }
  
  if (minutes < 60) {
    return `${minutes} minutos`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hora${hours > 1 ? 's' : ''} y ${remainingMinutes} minutos`;
};

// NOTA: Esta función se mantiene solo para compatibilidad con código legacy
// La validación real se hace en el backend a través de scheduleService.validateRoomAccess()
export const validateRoomAccess = (
  roomId: number,
  userSchedules: any[],
  currentTime?: Date
): { canAccess: boolean; reason: string; activeSchedule?: any } => {
  // Esta es una validación básica solo para UX
  // La validación real se hace en el backend
  const now = currentTime || new Date();
  
  // Filtrar turnos para la sala específica
  const roomSchedules = userSchedules.filter(schedule => 
    schedule.room === roomId && schedule.status === 'active'
  );
  
  if (roomSchedules.length === 0) {
    return {
      canAccess: false,
      reason: 'No tienes turno asignado en esta sala'
    };
  }
  
  // Buscar turno activo
  const activeSchedule = roomSchedules.find(schedule => {
    const startTime = new Date(schedule.start_datetime);
    const endTime = new Date(schedule.end_datetime);
    return now >= startTime && now <= endTime;
  });
  
  if (activeSchedule) {
    return {
      canAccess: true,
      reason: 'Tienes turno activo en esta sala',
      activeSchedule
    };
  }
  
  // Buscar próximo turno
  const upcomingSchedule = roomSchedules.find(schedule => {
    const startTime = new Date(schedule.start_datetime);
    return now < startTime;
  });
  
  if (upcomingSchedule) {
    const startTime = new Date(upcomingSchedule.start_datetime);
    const timeUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
    
    return {
      canAccess: false,
      reason: `Tu turno comienza en ${formatTimeRemaining(timeUntilStart)}`,
      activeSchedule: upcomingSchedule
    };
  }
  
  return {
    canAccess: false,
    reason: 'No tienes turno activo en este horario'
  };
};
