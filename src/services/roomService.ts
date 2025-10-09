import { apiClient } from '../utils/api';

export interface Room {
  id: number;
  name: string;
  code?: string;
  capacity?: number;
  description?: string;
}

const roomService = {
  // Obtener todas las salas disponibles
  async getRooms(): Promise<Room[]> {
    try {
      const response = await apiClient.get('/api/rooms/') as any;
      
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
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  // Obtener detalle de una sala específica
  async getRoomById(id: number): Promise<Room> {
    try {
      const response = await apiClient.get(`/api/rooms/${id}/`);
      return response as Room;
    } catch (error) {
      console.error('Error fetching room:', error);
      throw error;
    }
  }
};

export default roomService;