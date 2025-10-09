import { describe, it, expect, vi } from 'vitest'
import scheduleService from '../scheduleService'

// Mock para localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'mockToken123'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
})

// Mock para fetch
global.fetch = vi.fn()

describe('scheduleService - Compliance Check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ejecuta verificación de cumplimiento correctamente', async () => {
    const mockResponse = {
      ok: true,
      headers: {
        get: vi.fn(() => 'application/json')
      },
      json: () => Promise.resolve({
        message: 'Verificación de cumplimiento ejecutada',
        notifications_sent: 2,
        non_compliant_schedules: 1
      })
    }

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

    const result = await scheduleService.runComplianceCheck()

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/schedule/schedules/run_compliance_check/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Token mockToken123',
          'Content-Type': 'application/json'
        })
      })
    )

    expect(result).toEqual({
      message: 'Verificación de cumplimiento ejecutada',
      notifications_sent: 2,
      non_compliant_schedules: 1
    })
  })

  it('maneja errores en la verificación de cumplimiento', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      headers: {
        get: vi.fn(() => 'application/json')
      },
      json: () => Promise.resolve({
        error: 'Error interno del servidor'
      })
    }

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response)

    await expect(scheduleService.runComplianceCheck()).rejects.toThrow()
  })

  it('maneja errores de red', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    await expect(scheduleService.runComplianceCheck()).rejects.toThrow('Network error')
  })
})
