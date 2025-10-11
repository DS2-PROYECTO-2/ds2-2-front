import { describe, it, expect } from 'vitest'
import { 
  toBogotaTime, 
  getBogotaNow, 
  getMinutesDifference, 
  isLateArrival, 
  getLateMinutes 
} from '../timeHelpers'

describe('timeHelpers - New Features', () => {
  describe('toBogotaTime', () => {
    it('convierte UTC a hora de Bogotá correctamente', () => {
      const utcDate = new Date('2025-01-15T15:00:00Z') // 3:00 PM UTC
      const bogotaTime = toBogotaTime(utcDate)
      
      // Bogotá está UTC-5, así que 15:00 UTC = 10:00 AM Bogotá
      expect(bogotaTime.getHours()).toBe(10)
      expect(bogotaTime.getMinutes()).toBe(0)
    })

    it('maneja cambio de día correctamente', () => {
      const utcDate = new Date('2025-01-15T06:00:00Z') // 6:00 AM UTC
      const bogotaTime = toBogotaTime(utcDate)
      
      // 6:00 AM UTC = 1:00 AM Bogotá (mismo día)
      expect(bogotaTime.getHours()).toBe(1)
      expect(bogotaTime.getDate()).toBe(15) // Mismo día
    })
  })

  describe('getBogotaNow', () => {
    it('retorna la hora actual de Bogotá', () => {
      const bogotaNow = getBogotaNow()
      
      expect(bogotaNow).toBeInstanceOf(Date)
      expect(bogotaNow.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('getMinutesDifference', () => {
    it('calcula diferencia positiva correctamente', () => {
      const start = new Date('2025-01-15T09:00:00Z')
      const end = new Date('2025-01-15T09:30:00Z')
      
      const diff = getMinutesDifference(start, end)
      expect(diff).toBe(-30) // end - start = 30 - 0 = 30, pero la función retorna start - end
    })

    it('calcula diferencia negativa correctamente', () => {
      const start = new Date('2025-01-15T09:30:00Z')
      const end = new Date('2025-01-15T09:00:00Z')
      
      const diff = getMinutesDifference(start, end)
      expect(diff).toBe(30) // start - end = 30 - 0 = 30
    })

    it('calcula diferencia cero correctamente', () => {
      const start = new Date('2025-01-15T09:00:00Z')
      const end = new Date('2025-01-15T09:00:00Z')
      
      const diff = getMinutesDifference(start, end)
      expect(diff).toBe(0)
    })
  })

  describe('isLateArrival', () => {
    it('detecta llegada tarde con período de gracia de 5 minutos', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:10:00Z') // 10 minutos tarde
      
      const isLate = isLateArrival(actualTime, scheduleStart, 5)
      expect(isLate).toBe(true)
    })

    it('no detecta llegada tarde dentro del período de gracia', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:03:00Z') // 3 minutos tarde
      
      const isLate = isLateArrival(actualTime, scheduleStart, 5)
      expect(isLate).toBe(false)
    })

    it('detecta llegada tarde en el límite del período de gracia', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:06:00Z') // 6 minutos tarde (más del límite)
      
      const isLate = isLateArrival(actualTime, scheduleStart, 5)
      expect(isLate).toBe(true)
    })

    it('no detecta llegada tarde cuando llega antes', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T08:55:00Z') // 5 minutos antes
      
      const isLate = isLateArrival(actualTime, scheduleStart, 5)
      expect(isLate).toBe(false)
    })

    it('usa período de gracia por defecto de 5 minutos', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:10:00Z') // 10 minutos tarde
      
      const isLate = isLateArrival(actualTime, scheduleStart)
      expect(isLate).toBe(true)
    })
  })

  describe('getLateMinutes', () => {
    it('calcula minutos de retraso correctamente', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:15:00Z') // 15 minutos tarde
      
      const lateMinutes = getLateMinutes(actualTime, scheduleStart, 5)
      expect(lateMinutes).toBe(10) // 15 - 5 (período de gracia)
    })

    it('retorna 0 cuando no hay retraso', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:03:00Z') // 3 minutos tarde
      
      const lateMinutes = getLateMinutes(actualTime, scheduleStart, 5)
      expect(lateMinutes).toBe(0)
    })

    it('retorna 0 cuando llega antes', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T08:55:00Z') // 5 minutos antes
      
      const lateMinutes = getLateMinutes(actualTime, scheduleStart, 5)
      expect(lateMinutes).toBe(0)
    })

    it('usa período de gracia por defecto de 5 minutos', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:15:00Z') // 15 minutos tarde
      
      const lateMinutes = getLateMinutes(actualTime, scheduleStart)
      expect(lateMinutes).toBe(10) // 15 - 5 (período de gracia por defecto)
    })

    it('maneja períodos de gracia personalizados', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:15:00Z') // 15 minutos tarde
      
      const lateMinutes = getLateMinutes(actualTime, scheduleStart, 10)
      expect(lateMinutes).toBe(5) // 15 - 10 (período de gracia personalizado)
    })
  })

  describe('Casos edge', () => {
    it('maneja fechas en diferentes zonas horarias', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00-05:00') // Bogotá
      const actualTime = new Date('2025-01-15T14:00:00Z') // UTC
      
      const isLate = isLateArrival(actualTime, scheduleStart, 5)
      expect(isLate).toBe(false) // 14:00 UTC = 09:00 Bogotá
    })

    it('maneja diferencias de segundos', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T09:00:30Z') // 30 segundos tarde
      
      const isLate = isLateArrival(actualTime, scheduleStart, 5)
      expect(isLate).toBe(false) // Menos de 1 minuto
    })

    it('maneja diferencias de horas', () => {
      const scheduleStart = new Date('2025-01-15T09:00:00Z')
      const actualTime = new Date('2025-01-15T11:00:00Z') // 2 horas tarde
      
      const lateMinutes = getLateMinutes(actualTime, scheduleStart, 5)
      expect(lateMinutes).toBe(115) // 120 - 5
    })
  })
})
