import { describe, it, expect} from 'vitest'
import { toBogotaTime, getBogotaNow, getMinutesDifference, isLateArrival, getLateMinutes } from '../timeHelpers'

describe('timeHelpers', () => {
  describe('toBogotaTime', () => {
    it('convierte fecha UTC a zona horaria de Bogotá', () => {
      const utcDate = new Date('2025-10-09T14:00:00Z')
      const bogotaTime = toBogotaTime(utcDate)
      
      // Bogotá está UTC-5, así que 14:00 UTC = 09:00 Bogotá
      expect(bogotaTime.getHours()).toBe(9)
      expect(bogotaTime.getMinutes()).toBe(0)
    })
  })

  describe('getBogotaNow', () => {
    it('obtiene la fecha actual en zona horaria de Bogotá', () => {
      const now = getBogotaNow()
      
      expect(now).toBeInstanceOf(Date)
      expect(now.getTime()).toBeGreaterThan(0)
      // Verificar que la fecha esté en un rango razonable (últimos 10 años)
      const tenYearsAgo = Date.now() - (10 * 365 * 24 * 60 * 60 * 1000)
      const oneYearFromNow = Date.now() + (365 * 24 * 60 * 60 * 1000)
      expect(now.getTime()).toBeGreaterThan(tenYearsAgo)
      expect(now.getTime()).toBeLessThan(oneYearFromNow)
    })
  })

  describe('getMinutesDifference', () => {
    it('calcula diferencia en minutos entre dos fechas', () => {
      const date1 = new Date('2025-10-09T14:00:00Z')
      const date2 = new Date('2025-10-09T14:30:00Z')
      
      const diff = getMinutesDifference(date1, date2)
      expect(diff).toBe(-30) // date1 - date2 = 14:00 - 14:30 = -30
    })

    it('calcula diferencia positiva cuando la primera fecha es posterior', () => {
      const date1 = new Date('2025-10-09T14:30:00Z')
      const date2 = new Date('2025-10-09T14:00:00Z')
      
      const diff = getMinutesDifference(date1, date2)
      expect(diff).toBe(30) // date1 - date2 = 14:30 - 14:00 = 30
    })
  })

  describe('isLateArrival', () => {
    it('detecta llegada tarde cuando la entrada es después del período de gracia', () => {
      const scheduleStart = new Date('2025-10-09T14:00:00Z')
      const entryTime = new Date('2025-10-09T14:25:00Z') // 25 minutos después
      const graceMinutes = 20

      const isLate = isLateArrival(entryTime, scheduleStart, graceMinutes)
      expect(isLate).toBe(true)
    })

    it('no detecta llegada tarde cuando la entrada está dentro del período de gracia', () => {
      const scheduleStart = new Date('2025-10-09T14:00:00Z')
      const entryTime = new Date('2025-10-09T14:15:00Z') // 15 minutos después
      const graceMinutes = 20

      const isLate = isLateArrival(entryTime, scheduleStart, graceMinutes)
      expect(isLate).toBe(false)
    })

    it('detecta llegada tarde con período de gracia de 1 minuto para testing', () => {
      const scheduleStart = new Date('2025-10-09T14:00:00Z')
      const entryTime = new Date('2025-10-09T14:02:00Z') // 2 minutos después
      const graceMinutes = 1

      const isLate = isLateArrival(entryTime, scheduleStart, graceMinutes)
      expect(isLate).toBe(true)
    })
  })

  describe('getLateMinutes', () => {
    it('calcula minutos de retraso correctamente', () => {
      const scheduleStart = new Date('2025-10-09T14:00:00Z')
      const entryTime = new Date('2025-10-09T14:25:00Z') // 25 minutos después
      const graceMinutes = 20

      const lateMinutes = getLateMinutes(entryTime, scheduleStart, graceMinutes)
      expect(lateMinutes).toBe(5) // 25 - 20 = 5 minutos de retraso
    })

    it('retorna 0 cuando no hay retraso', () => {
      const scheduleStart = new Date('2025-10-09T14:00:00Z')
      const entryTime = new Date('2025-10-09T14:15:00Z') // 15 minutos después
      const graceMinutes = 20

      const lateMinutes = getLateMinutes(entryTime, scheduleStart, graceMinutes)
      expect(lateMinutes).toBe(0)
    })
  })
})
