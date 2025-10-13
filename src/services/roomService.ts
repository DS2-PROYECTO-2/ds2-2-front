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
    const response = await apiClient.get('/api/rooms/') as Room[] | { results: Room[] };
    
    // Si la respuesta es un array directo
    if (Array.isArray(response)) {
      return response;
    }
    
    // Si la respuesta tiene paginación
    if (response && response.results && Array.isArray(response.results)) {
      return response.results;
    }
    
    return [];
  },

  // Obtener detalle de una sala específica
  async getRoomById(id: number): Promise<Room> {
    const response = await apiClient.get(`/api/rooms/${id}/`);
    return response as Room;
  }
};

export default roomService;