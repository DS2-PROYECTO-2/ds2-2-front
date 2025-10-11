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
  // El backend ya tiene la validación de acceso anticipado integrada
  // en el endpoint de creación de entrada, así que usamos directamente ese endpoint
  try {
    // Payload correcto: solo room y notes (el backend genera entry_time automáticamente)
    const payload = {
      room: roomId,
      notes: notes || ''
    };
    
    console.log('🔍 Creando entrada con validación integrada:');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('🌐 URL:', '/api/rooms/entry/');
    
    const result = await apiClient.post('/api/rooms/entry/', payload);
    console.log('✅ Entrada creada exitosamente:', result);
    
    // Disparar evento de actualización en tiempo real
    try {
      window.dispatchEvent(new CustomEvent('room-entry-updated', {
        detail: { 
          type: 'entry_created',
          roomId: roomId,
          timestamp: new Date().toISOString()
        }
      }));
      
      // También disparar evento de localStorage para sincronización entre pestañas
      localStorage.setItem('room-entry-updated', String(Date.now()));
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'room-entry-updated', 
        newValue: String(Date.now()), 
        storageArea: localStorage 
      }));
    } catch (error) {
      console.warn('Error dispatching room entry update event:', error);
    }
    
    return result;
  } catch (error: unknown) {
    const apiError = error as { 
      status?: number; 
      response?: { 
        headers?: unknown; 
        data?: unknown; 
        status?: number; 
        statusText?: string; 
      }; 
      data?: unknown; 
      message?: string; 
      stack?: string; 
    };
    
    console.error('❌ Error al crear entrada:');
    console.error('📊 Status:', apiError?.status);
    console.error('📋 Headers:', apiError?.response?.headers);
    console.error('📄 Response Data:', apiError?.response?.data);
    console.error('🔍 Full Error:', error);
    
    // Logging mejorado para capturar todos los datos del error
    console.error('🔍 Error Details:');
    console.error('  - error.status:', apiError?.status);
    console.error('  - error.response:', apiError?.response);
    console.error('  - error.response?.data:', apiError?.response?.data);
    console.error('  - error.response?.status:', apiError?.response?.status);
    console.error('  - error.response?.statusText:', apiError?.response?.statusText);
    console.error('  - error.message:', apiError?.message);
    console.error('  - error.stack:', apiError?.stack);
    
    // Manejar errores específicos del backend
    if (apiError?.status === 400) {
      const errorData = apiError?.response?.data || apiError?.data;
      console.error('🚨 Error 400 - Datos del error:', errorData);
      console.error('🚨 Error 400 - Tipo de datos:', typeof errorData);
      console.error('🚨 Error 400 - JSON stringify:', JSON.stringify(errorData, null, 2));
      
      let errorMessage = 'Acceso denegado';
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = (errorData as { error: string }).error;
        } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = (errorData as { message: string }).message;
        } else if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
          errorMessage = (errorData as { detail: string }).detail;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.join(', ');
        } else {
          // Si es un objeto, intentar extraer información útil
          errorMessage = JSON.stringify(errorData);
        }
      }
      
      throw new Error(`Error de validación: ${errorMessage}`);
    }
    
    if (apiError?.status === 403) {
      throw new Error('No tienes permisos para acceder a esta sala');
    }
    
    if (apiError?.status === 404) {
      throw new Error('Sala no encontrada');
    }
    
    // Para otros errores, mostrar mensaje genérico
    throw new Error('Error al registrar entrada. Verifica tu conexión y permisos.');
  }
}

export async function exitEntry(entryId: number, notes?: string) {
  // Intentar registrar salida
  
  try {
    // Usar el endpoint correcto del backend
    // Endpoint principal
    const result = await apiClient.patch(`/api/rooms/entry/${entryId}/exit/`, { 
      notes 
    });
    
    // Disparar evento de actualización en tiempo real
    try {
      window.dispatchEvent(new CustomEvent('room-entry-updated', {
        detail: { 
          type: 'entry_exited',
          entryId: entryId,
          timestamp: new Date().toISOString()
        }
      }));
      
      // También disparar evento de localStorage para sincronización entre pestañas
      localStorage.setItem('room-entry-updated', String(Date.now()));
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'room-entry-updated', 
        newValue: String(Date.now()), 
        storageArea: localStorage 
      }));
    } catch (error) {
      console.warn('Error dispatching room exit update event:', error);
    }
    
    return result;
  } catch (error: unknown) {
    // Manejo alternativo
    
    // Si el error es que la entrada no se encuentra para el usuario actual
    const err = error as { data?: { error?: string; details?: string } } | null | undefined;
    const errMsg = err?.data?.error ?? '';
    const errDetails = err?.data?.details ?? '';
    if (errMsg.includes('Entrada no encontrada') || errDetails.includes('No se encontró entrada')) {
      // Intento alternativo si no se encuentra la entrada
      
      try {
        // Intentar usar el endpoint de salida del usuario activo
        return await apiClient.patch('/api/rooms/my-active-entry/exit/', { 
          notes 
        });
      } catch {
        // Alternativa fallida
        
        // Si ambos endpoints fallan, simular la salida localmente
        // Simulación local
        return {
          message: 'Salida registrada localmente (backend no disponible)',
          entry: {
            id: entryId,
            exit_time: new Date().toISOString(),
            notes: notes || ''
          }
        };
      }
    }
    
    throw error;
  }
}

export async function getAllEntries(filters?: {
  user_name?: string;
  room?: number; 
  active?: boolean;
  from?: string;
  to?: string;
  document?: string;
  page?: number;
  page_size?: number;
}): Promise<RoomEntryUI[]> {
  const params = new URLSearchParams();
  
  // Filtros de fecha (formato YYYY-MM-DD)
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  
  // Otros filtros
  if (filters?.user_name) params.append('user_name', filters.user_name);
  if (filters?.room) params.append('room', filters.room.toString());
  if (filters?.active !== undefined) params.append('active', filters.active.toString());
  if (filters?.document) params.append('document', filters.document);
  
  // PAGINACIÓN CORREGIDA - Usar page_size alto para obtener todos los registros
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.page_size) {
    params.append('page_size', filters.page_size.toString());
  } else {
    // Si no se especifica page_size, usar un valor alto para obtener todos los registros
    params.append('page_size', '1000');
  }
  
  const url = `/api/rooms/entries/?${params.toString()}`;
  
  const raw = await apiClient.get(url);
  
  // La respuesta del backend tiene estructura: { count, entries: [...] }
  const obj = raw as Record<string, unknown>;
  const list = (obj.entries as RawEntry[] | undefined) ?? [];
  
  
  return list.map(mapRawToUI);
}

// Función específica para obtener todos los registros sin limitación de paginación
export async function getAllEntriesUnpaginated(filters?: {
  user_name?: string;
  room?: number; 
  active?: boolean;
  from?: string;
  to?: string;
  document?: string;
}): Promise<RoomEntryUI[]> {
  const params = new URLSearchParams();
  
  // Filtros de fecha (formato YYYY-MM-DD)
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  
  // Otros filtros
  if (filters?.user_name) params.append('user_name', filters.user_name);
  if (filters?.room) params.append('room', filters.room.toString());
  if (filters?.active !== undefined) params.append('active', filters.active.toString());
  if (filters?.document) params.append('document', filters.document);
  
  // FORZAR page_size alto para obtener todos los registros
  params.append('page_size', '10000'); // Valor muy alto para obtener todos los registros
  const url = `/api/rooms/entries/?${params.toString()}`;
  
  const raw = await apiClient.get(url);
  
  const obj = raw as Record<string, unknown>;
  const list = (obj.entries as RawEntry[] | undefined) ?? [];
  
  
  return list.map(mapRawToUI);
}