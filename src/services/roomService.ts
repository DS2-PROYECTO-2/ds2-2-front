import { apiClient } from '../utils/api';

export interface Room {
  id: number;
  name: string;
  code?: string;
}

export async function fetchRooms(): Promise<Room[]> {
  const data = await apiClient.get('/api/rooms/');
  return data as Room[];
}