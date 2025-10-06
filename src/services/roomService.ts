import { apiClient } from '../utils/api';

export interface Room {
  id: number;
  name: string;
  code?: string;
}

export async function fetchRooms(): Promise<Room[]> {
  // La base ya incluye /api, los endpoints ahora son relativos a esa base
  const data = await apiClient.get('/api/rooms/');
  return data as Room[];
}