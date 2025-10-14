import { describe, it, expect, vi, beforeEach } from 'vitest'
import equipmentService, { type Equipment } from '../equipmentService'
import * as api from '../../utils/api'

// Mock del apiClient
vi.mock('../../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('equipmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEquipment', () => {
    it('should return equipment array when response is direct array', async () => {
      const mockEquipment: Equipment[] = [
        { id: 1, name: 'Laptop', type: 'computer', status: 'available', room_id: 1 },
        { id: 2, name: 'Monitor', type: 'display', status: 'in_use', room_id: 1 }
      ]

      vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce(mockEquipment)

      const result = await equipmentService.getEquipment()

      expect(result).toEqual(mockEquipment)
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/equipment/equipment/')
    })

    it('should return equipment array when response has pagination', async () => {
      const mockEquipment: Equipment[] = [
        { id: 1, name: 'Laptop', type: 'computer', status: 'available' }
      ]
      const mockResponse = { results: mockEquipment }

      vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce(mockResponse)

      const result = await equipmentService.getEquipment()

      expect(result).toEqual(mockEquipment)
    })

    it('should return empty array when response is invalid', async () => {
      vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce(null)

      const result = await equipmentService.getEquipment()

      expect(result).toEqual([])
    })

    it('should throw error when API call fails', async () => {
      const mockError = new Error('API Error')
      vi.spyOn(api.apiClient, 'get').mockRejectedValueOnce(mockError)

      await expect(equipmentService.getEquipment()).rejects.toThrow('API Error')
    })
  })

  describe('getEquipmentById', () => {
    it('should return equipment by id', async () => {
      const mockEquipment: Equipment = {
        id: 1,
        name: 'Laptop',
        type: 'computer',
        status: 'available',
        room_id: 1
      }

      vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce(mockEquipment)

      const result = await equipmentService.getEquipmentById(1)

      expect(result).toEqual(mockEquipment)
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/equipment/equipment/1/')
    })

    it('should throw error when API call fails', async () => {
      const mockError = new Error('Not Found')
      vi.spyOn(api.apiClient, 'get').mockRejectedValueOnce(mockError)

      await expect(equipmentService.getEquipmentById(999)).rejects.toThrow('Not Found')
    })
  })

  describe('createEquipment', () => {
    it('should create new equipment', async () => {
      const newEquipment: Omit<Equipment, 'id'> = {
        name: 'New Laptop',
        type: 'computer',
        status: 'available',
        room_id: 1
      }

      const createdEquipment: Equipment = {
        id: 3,
        ...newEquipment
      }

      vi.spyOn(api.apiClient, 'post').mockResolvedValueOnce(createdEquipment)

      const result = await equipmentService.createEquipment(newEquipment)

      expect(result).toEqual(createdEquipment)
      expect(api.apiClient.post).toHaveBeenCalledWith('/api/equipment/equipment/', newEquipment)
    })

    it('should throw error when creation fails', async () => {
      const newEquipment: Omit<Equipment, 'id'> = {
        name: 'New Laptop',
        type: 'computer',
        status: 'available'
      }

      const mockError = new Error('Validation Error')
      vi.spyOn(api.apiClient, 'post').mockRejectedValueOnce(mockError)

      await expect(equipmentService.createEquipment(newEquipment)).rejects.toThrow('Validation Error')
    })
  })

  describe('updateEquipment', () => {
    it('should update equipment', async () => {
      const updateData: Partial<Equipment> = {
        status: 'maintenance'
      }

      const updatedEquipment: Equipment = {
        id: 1,
        name: 'Laptop',
        type: 'computer',
        status: 'maintenance',
        room_id: 1
      }

      vi.spyOn(api.apiClient, 'patch').mockResolvedValueOnce(updatedEquipment)

      const result = await equipmentService.updateEquipment(1, updateData)

      expect(result).toEqual(updatedEquipment)
      expect(api.apiClient.patch).toHaveBeenCalledWith('/api/equipment/equipment/1/', updateData)
    })

    it('should throw error when update fails', async () => {
      const updateData: Partial<Equipment> = {
        status: 'maintenance'
      }

      const mockError = new Error('Update Failed')
      vi.spyOn(api.apiClient, 'patch').mockRejectedValueOnce(mockError)

      await expect(equipmentService.updateEquipment(1, updateData)).rejects.toThrow('Update Failed')
    })
  })

  describe('deleteEquipment', () => {
    it('should delete equipment', async () => {
      vi.spyOn(api.apiClient, 'delete').mockResolvedValueOnce(undefined)

      await equipmentService.deleteEquipment(1)

      expect(api.apiClient.delete).toHaveBeenCalledWith('/api/equipment/equipment/1/')
    })

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Delete Failed')
      vi.spyOn(api.apiClient, 'delete').mockRejectedValueOnce(mockError)

      await expect(equipmentService.deleteEquipment(1)).rejects.toThrow('Delete Failed')
    })
  })

  describe('getEquipmentReports', () => {
    it('should get equipment reports without date filters', async () => {
      const mockReports = [
        { id: 1, equipment_id: 1, report_type: 'maintenance', date: '2024-01-01' }
      ]

      vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce(mockReports)

      const result = await equipmentService.getEquipmentReports()

      expect(result).toEqual(mockReports)
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/equipment/reports/?')
    })

    it('should get equipment reports with date filters', async () => {
      const mockReports = [
        { id: 1, equipment_id: 1, report_type: 'maintenance', date: '2024-01-01' }
      ]

      vi.spyOn(api.apiClient, 'get').mockResolvedValueOnce(mockReports)

      const result = await equipmentService.getEquipmentReports('2024-01-01', '2024-01-31')

      expect(result).toEqual(mockReports)
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/equipment/reports/?date_from=2024-01-01&date_to=2024-01-31')
    })

    it('should throw error when reports fetch fails', async () => {
      const mockError = new Error('Reports Error')
      vi.spyOn(api.apiClient, 'get').mockRejectedValueOnce(mockError)

      await expect(equipmentService.getEquipmentReports()).rejects.toThrow('Reports Error')
    })
  })
})
