import { describe, it, expect } from 'vitest'

// Importar todas las exportaciones del index
import {
  authService,
  roomService,
  roomAccessService,
  roomManagementService,
  scheduleService,
  softScheduleService,
  userManagementService,
  notificationService,
  equipmentService,
  courseService
} from '../index'

describe('Services Index', () => {
  it('should export authService', () => {
    expect(authService).toBeDefined()
    expect(typeof authService).toBe('object')
  })

  it('should export roomService', () => {
    expect(roomService).toBeDefined()
    expect(typeof roomService).toBe('object')
  })

  it('should export roomAccessService', () => {
    expect(roomAccessService).toBeDefined()
    expect(typeof roomAccessService).toBe('object')
  })

  it('should export roomManagementService', () => {
    expect(roomManagementService).toBeDefined()
    expect(typeof roomManagementService).toBe('object')
  })

  it('should export scheduleService', () => {
    expect(scheduleService).toBeDefined()
    expect(typeof scheduleService).toBe('object')
  })

  it('should export softScheduleService', () => {
    expect(softScheduleService).toBeDefined()
    expect(typeof softScheduleService).toBe('object')
  })

  it('should export userManagementService', () => {
    expect(userManagementService).toBeDefined()
    expect(typeof userManagementService).toBe('object')
  })

  it('should export notificationService', () => {
    expect(notificationService).toBeDefined()
    expect(typeof notificationService).toBe('object')
  })


  it('should export equipmentService', () => {
    expect(equipmentService).toBeDefined()
    expect(typeof equipmentService).toBe('object')
  })

  it('should export courseService', () => {
    expect(courseService).toBeDefined()
    expect(typeof courseService).toBe('object')
  })

  it('should export all services as objects', () => {
    const services = [
      authService,
      roomService,
      roomAccessService,
      roomManagementService,
      scheduleService,
      softScheduleService,
      userManagementService,
      notificationService,
      equipmentService,
      courseService
    ]

    services.forEach(service => {
      expect(service).toBeDefined()
      expect(typeof service).toBe('object')
    })
  })
})
