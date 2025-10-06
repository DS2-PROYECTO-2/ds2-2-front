import { apiClient } from '../utils/api';

export interface RoomEntryUI {
  id: number;
  roomId: number;
  roomName?: string;
  startedAt: string; // ISO
  endedAt?: string | null;
  // Campos adicionales para admin
  userId?: number;
  userName?: string;
  userUsername?: string;
  userDocument?: string;
}

interface RawEntry {
  id: number;
  room?: number;
  room_id?: number;
  room_name?: string;
  room_code?: string;
  room_label?: string;
  entry_time?: string;
  started_at?: string;
  start_time?: string;
  exit_time?: string;
  ended_at?: string;
  end_time?: string;
  user?: number;
  user_id?: number;
  user_name?: string;
  user_username?: string;
  user_identification?: string;
  identification?: string;
  user_document?: string;
  document?: string;
}

function mapRawToUI(e: RawEntry): RoomEntryUI {
  return {
    id: e.id,
    roomId: e.room ?? e.room_id ?? 0,
    roomName: e.room_name ?? e.room_code ?? e.room_label ?? '',
    startedAt: e.entry_time ?? e.started_at ?? e.start_time ?? '',
    endedAt: e.exit_time ?? e.ended_at ?? e.end_time ?? null,
    // Campos adicionales para admin
    userId: e.user ?? e.user_id,
    userName: e.user_name,
    userUsername: e.user_username,
    userDocument: e.user_identification ?? e.identification ?? e.user_document ?? e.document ?? e.user_username,
  };
}



export async function getMyEntries(): Promise<RoomEntryUI[]> {
  const raw = await apiClient.get('/api/rooms/my-entries/');
  if (Array.isArray(raw)) return raw.map(mapRawToUI);
  const obj = raw as Record<string, unknown>;
  const list =
    (obj.entries as RawEntry[] | undefined) ??
    (obj.results as RawEntry[] | undefined) ??
    [];
  return list.map(mapRawToUI);
}

interface ActiveEntryResponse {
  has_active_entry: boolean;
  active_entry?: RawEntry;
}

export async function getMyActiveEntry(): Promise<{ has_active_entry: boolean; active_entry?: RoomEntryUI }> {
  const raw = await apiClient.get('/api/rooms/my-active-entry/') as ActiveEntryResponse;
  if (raw?.has_active_entry && raw.active_entry) {
    return { has_active_entry: true, active_entry: mapRawToUI(raw.active_entry) };
  }
  return { has_active_entry: false };
}

export async function createEntry(roomId: number, notes?: string) {
  return apiClient.post('/api/rooms/entry/', { room: roomId, notes });
}

export async function exitEntry(entryId: number, notes?: string) {
  return apiClient.patch(`/api/rooms/entry/${entryId}/exit/`, { notes });
}

export async function getAllEntries(filters?: {
  user?: string;
  room?: number; 
  active?: boolean;
  from?: string;
  to?: string;
  document?: string;
  page?: number;
  page_size?: number;
}): Promise<RoomEntryUI[]> {
  const params = new URLSearchParams();
  if (filters?.user) params.append('user_name', filters.user);
  if (filters?.room) params.append('room', filters.room.toString());
  if (filters?.active !== undefined) params.append('active', filters.active.toString());
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.document) params.append('identification', filters.document);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.page_size) params.append('page_size', filters.page_size.toString());
  
  const url = `/api/rooms/entries/?${params.toString()}`;
  const raw = await apiClient.get(url);
  
  // La respuesta del backend tiene estructura: { count, entries: [...] }
  const obj = raw as Record<string, unknown>;
  const list = (obj.entries as RawEntry[] | undefined) ?? [];
  
  return list.map(mapRawToUI);
}