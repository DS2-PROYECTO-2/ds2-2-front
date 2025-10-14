import { apiClient } from '../utils/api';

export interface Equipment {
  id: number;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  room_id?: number;
  description?: string;
  serial_number?: string;
}

const equipmentService = {
  // Obtener todos los equipos
  async getEquipment(): Promise<Equipment[]> {
    try {
      const response = await apiClient.get('/api/equipment/equipment/') as Equipment[] | { results: Equipment[] };
      
      // Si la respuesta es un array directo
      if (Array.isArray(response)) {
        return response;
      }
      
      // Si la respuesta tiene paginación
      if (response && response.results && Array.isArray(response.results)) {
        return response.results;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  },

  // Obtener equipo por ID
  async getEquipmentById(id: number): Promise<Equipment> {
    try {
      const response = await apiClient.get(`/api/equipment/equipment/${id}/`);
      return response as Equipment;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  },

  // Crear nuevo equipo
  async createEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    try {
      const response = await apiClient.post('/api/equipment/equipment/', equipment);
      return response as Equipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  },

  // Actualizar equipo
  async updateEquipment(id: number, equipment: Partial<Equipment>): Promise<Equipment> {
    try {
      const response = await apiClient.patch(`/api/equipment/equipment/${id}/`, equipment);
      return response as Equipment;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  },

  // Eliminar equipo
  async deleteEquipment(id: number): Promise<void> {
    try {
      await apiClient.delete(`/api/equipment/equipment/${id}/`);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  },

  // Obtener reportes de equipamiento
  async getEquipmentReports(dateFrom?: string, dateTo?: string): Promise<unknown[]> {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await apiClient.get(`/api/equipment/reports/?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching equipment reports:', error);
      throw error;
    }
  }
};

export default equipmentService;
