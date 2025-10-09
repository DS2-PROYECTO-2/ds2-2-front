/**
 * Utilidades para manejo de zona horaria
 */

/**
 * Convierte una fecha a la zona horaria de Bogotá (America/Bogota)
 * @param date - Fecha a convertir
 * @returns Fecha en zona horaria de Bogotá
 */
export const toBogotaTime = (date: Date): Date => {
  // Crear una nueva fecha en la zona horaria de Bogotá
  const bogotaString = date.toLocaleString("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  // Parsear la fecha formateada de vuelta a Date
  const [datePart, timePart] = bogotaString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute, second] = timePart.split(":");
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // Los meses en Date van de 0-11
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
};

/**
 * Obtiene la fecha actual en zona horaria de Bogotá
 * @returns Fecha actual en Bogotá
 */
export const getBogotaNow = (): Date => {
  return toBogotaTime(new Date());
};

/**
 * Calcula la diferencia en minutos entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Diferencia en minutos (positiva si date1 > date2)
 */
export const getMinutesDifference = (date1: Date, date2: Date): number => {
  return Math.round((date1.getTime() - date2.getTime()) / (1000 * 60));
};

/**
 * Verifica si una entrada es tardía basada en el inicio del turno
 * @param entryTime - Tiempo de entrada
 * @param scheduleStart - Inicio del turno
 * @param graceMinutes - Minutos de gracia (default: 20)
 * @returns true si es llegada tarde
 */
export const isLateArrival = (
  entryTime: Date, 
  scheduleStart: Date, 
  graceMinutes: number = 20
): boolean => {
  const entryBogota = toBogotaTime(entryTime);
  const scheduleBogota = toBogotaTime(scheduleStart);
  const graceEnd = new Date(scheduleBogota.getTime() + graceMinutes * 60 * 1000);
  
  return entryBogota.getTime() > graceEnd.getTime();
};

/**
 * Calcula los minutos de retraso
 * @param entryTime - Tiempo de entrada
 * @param scheduleStart - Inicio del turno
 * @param graceMinutes - Minutos de gracia (default: 20)
 * @returns Minutos de retraso (0 si no es tarde)
 */
export const getLateMinutes = (
  entryTime: Date,
  scheduleStart: Date,
  graceMinutes: number = 20
): number => {
  if (!isLateArrival(entryTime, scheduleStart, graceMinutes)) {
    return 0;
  }
  
  const entryBogota = toBogotaTime(entryTime);
  const scheduleBogota = toBogotaTime(scheduleStart);
  const graceEnd = new Date(scheduleBogota.getTime() + graceMinutes * 60 * 1000);
  
  return Math.max(0, getMinutesDifference(entryBogota, graceEnd));
};
