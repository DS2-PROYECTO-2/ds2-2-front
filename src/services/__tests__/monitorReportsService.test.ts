import { describe, it, expect, vi, beforeEach } from 'vitest'
import { monitorReportsService } from '../monitorReportsService'
import { apiClient } from '../../utils/api'
import { getMyEntries } from '../roomEntryService'
import scheduleService from '../scheduleService'

// Mock de apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn()
  }
}))

// Mock de roomEntryService
vi.mock('../roomEntryService', () => ({
  getMyEntries: vi.fn()
}))

// Mock de scheduleService
vi.mock('../scheduleService', () => ({
  default: {
    getSchedules: vi.fn()
  }
}))

describe('monitorReportsService', () => {
  const mockParams = new URLSearchParams({
    from_date: '2024-01-01',
    to_date: '2024-01-31',
    room_id: '1'
  })

  const mockEntries = [
    {
      id: 1,
      entry_time: '2024-01-15T09:00:00Z',
      exit_time: '2024-01-15T17:00:00Z',
      user_id: 1,
      room_id: 1
    },
    {
      id: 2,
      entry_time: '2024-01-16T09:05:00Z',
      exit_time: '2024-01-16T17:00:00Z',
      user_id: 1,
      room_id: 1
    }
  ]

  const mockSchedules = [
    {
      id: 1,
      start_datetime: '2024-01-15T09:00:00Z',
      end_datetime: '2024-01-15T17:00:00Z',
      user_id: 1,
      room_id: 1
    },
    {
      id: 2,
      start_datetime: '2024-01-16T09:00:00Z',
      end_datetime: '2024-01-16T17:00:00Z',
      user_id: 1,
      room_id: 1
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMonitorStats', () => {
    it('should calculate basic stats for monitor', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.getMonitorStats(mockParams)

      expect(result).toHaveProperty('late_arrivals_count')
      expect(result).toHaveProperty('total_assigned_hours')
      expect(result).toHaveProperty('total_worked_hours')
      expect(result).toHaveProperty('remaining_hours')
      expect(typeof result.late_arrivals_count).toBe('number')
      expect(typeof result.total_assigned_hours).toBe('number')
      expect(typeof result.total_worked_hours).toBe('number')
      expect(typeof result.remaining_hours).toBe('number')
    })

    it('should handle empty data', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce([])
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce([])

      const result = await monitorReportsService.getMonitorStats(mockParams)

      expect(result.late_arrivals_count).toBe(0)
      expect(result.total_assigned_hours).toBe(0)
      expect(result.total_worked_hours).toBe(0)
      expect(result.remaining_hours).toBe(0)
    })

    it('should apply room filter when room_id is provided', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.getMonitorStats(mockParams)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('late_arrivals_count')
      expect(result).toHaveProperty('total_assigned_hours')
      expect(result).toHaveProperty('total_worked_hours')
      expect(result).toHaveProperty('remaining_hours')
    })
  })

  describe('getMonitorWorkedHours', () => {
    it('should calculate worked hours for monitor', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.getMonitorWorkedHours(mockParams)

      expect(result).toHaveProperty('total_worked_hours')
      expect(result).toHaveProperty('total_assigned_hours')
      expect(result).toHaveProperty('compliance_percentage')
      expect(result).toHaveProperty('overlaps_found')
      expect(result).toHaveProperty('user_hours')
      expect(result).toHaveProperty('schedule_hours')
      expect(typeof result.total_worked_hours).toBe('number')
      expect(typeof result.total_assigned_hours).toBe('number')
      expect(typeof result.compliance_percentage).toBe('number')
      expect(Array.isArray(result.overlaps_found)).toBe(true)
      expect(typeof result.user_hours).toBe('object')
      expect(typeof result.schedule_hours).toBe('object')
    })

    it('should handle empty data for worked hours', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce([])
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce([])

      const result = await monitorReportsService.getMonitorWorkedHours(mockParams)

      expect(result.total_worked_hours).toBe(0)
      expect(result.total_assigned_hours).toBe(0)
      expect(result.compliance_percentage).toBe(0)
      expect(result.overlaps_found).toEqual([])
    })
  })

  describe('getMonitorSchedules', () => {
    it('should fetch schedules from API', async () => {
      const mockResponse = { schedules: mockSchedules }
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await monitorReportsService.getMonitorSchedules(mockParams, 1)

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/schedule/my-schedules/')
      )
      expect(result).toEqual(mockSchedules)
    })

    it('should handle different response structures', async () => {
      const mockResponse = {
        past_schedules: [mockSchedules[0]],
        current_schedules: [mockSchedules[1]],
        upcoming_schedules: []
      }
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await monitorReportsService.getMonitorSchedules(mockParams, 1)

      expect(result).toEqual(mockSchedules)
    })

    it('should handle API errors with fallback', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API Error'))
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.getMonitorSchedules(mockParams, 1)

      expect(scheduleService.getSchedules).toHaveBeenCalled()
      expect(result).toEqual(mockSchedules)
    })
  })

  describe('getMonitorEntries', () => {
    it('should fetch entries from API', async () => {
      const mockResponse = { entries: mockEntries }
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await monitorReportsService.getMonitorEntries(mockParams)

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/rooms/my-entries/')
      )
      expect(result).toEqual(mockEntries)
    })

    it('should handle direct array response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockEntries)

      const result = await monitorReportsService.getMonitorEntries(mockParams)

      expect(result).toEqual(mockEntries)
    })

    it('should handle API errors with fallback', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API Error'))
      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)

      const result = await monitorReportsService.getMonitorEntries(mockParams)

      expect(getMyEntries).toHaveBeenCalled()
      expect(result).toEqual(mockEntries)
    })

    it('should work without parameters', async () => {
      const mockResponse = { entries: mockEntries }
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const result = await monitorReportsService.getMonitorEntries()

      expect(apiClient.get).toHaveBeenCalledWith('/api/rooms/my-entries/')
      expect(result).toEqual(mockEntries)
    })
  })

  describe('calculateBasicStats', () => {
    it('should calculate stats with valid data', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.calculateBasicStats(mockParams)

      expect(result).toHaveProperty('late_arrivals_count')
      expect(result).toHaveProperty('total_assigned_hours')
      expect(result).toHaveProperty('total_worked_hours')
      expect(result).toHaveProperty('remaining_hours')
    })

    it('should handle invalid date formats gracefully', async () => {
      const invalidEntries = [
        {
          id: 1,
          entry_time: 'invalid-date',
          exit_time: 'invalid-date',
          user_id: 1,
          room_id: 1
        }
      ]

      vi.mocked(getMyEntries).mockResolvedValueOnce(invalidEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce([])

      const result = await monitorReportsService.calculateBasicStats(mockParams)

      expect(result.late_arrivals_count).toBe(0)
      expect(result.total_worked_hours).toBe(0)
    })
  })

  describe('calculateBasicWorkedHours', () => {
    it('should calculate worked hours with valid data', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.calculateBasicWorkedHours(mockParams)

      expect(result).toHaveProperty('total_worked_hours')
      expect(result).toHaveProperty('total_assigned_hours')
      expect(result).toHaveProperty('compliance_percentage')
      expect(result).toHaveProperty('overlaps_found')
      expect(result).toHaveProperty('user_hours')
      expect(result).toHaveProperty('schedule_hours')
    })

    it('should handle empty data for worked hours calculation', async () => {
      vi.mocked(getMyEntries).mockResolvedValueOnce([])
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce([])

      const result = await monitorReportsService.calculateBasicWorkedHours(mockParams)

      expect(result.total_worked_hours).toBe(0)
      expect(result.total_assigned_hours).toBe(0)
      expect(result.compliance_percentage).toBe(0)
      expect(result.overlaps_found).toEqual([])
    })
  })

  describe('date filtering', () => {
    it('should apply date filters correctly', async () => {
      const paramsWithDate = new URLSearchParams({
        from_date: '2024-01-15',
        to_date: '2024-01-16'
      })

      vi.mocked(getMyEntries).mockResolvedValueOnce(mockEntries)
      vi.mocked(scheduleService.getSchedules).mockResolvedValueOnce(mockSchedules)

      const result = await monitorReportsService.getMonitorStats(paramsWithDate)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('late_arrivals_count')
      expect(result).toHaveProperty('total_assigned_hours')
      expect(result).toHaveProperty('total_worked_hours')
      expect(result).toHaveProperty('remaining_hours')
    })
  })

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(getMyEntries).mockRejectedValueOnce(new Error('Service Error'))
      vi.mocked(scheduleService.getSchedules).mockRejectedValueOnce(new Error('Service Error'))

      const result = await monitorReportsService.getMonitorStats(mockParams)

      expect(result).toBeDefined()
      expect(result.late_arrivals_count).toBe(0)
      expect(result.total_assigned_hours).toBe(0)
      expect(result.total_worked_hours).toBe(0)
      expect(result.remaining_hours).toBe(0)
    })
  })
})
