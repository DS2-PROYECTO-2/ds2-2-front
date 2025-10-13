// src/utils/api.ts - REEMPLAZAR todo el contenido
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

type ApiError = {
  status: number;
  data: unknown;
  message: string;
};

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Token ${token}`;
  return headers;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // NO desloguear automáticamente - dejar que el UI maneje los errores
    // Solo desloguear en casos críticos de token corrupto, no en errores de permisos
    
    let msg = '';
    let errorData = payload;
    
    if (typeof payload === 'string') {
      // Si es HTML (página de error del servidor), extraer información útil
      if (payload.includes('<!DOCTYPE html>') || payload.includes('<html')) {
        console.error('Backend returned HTML error page instead of JSON:', payload.substring(0, 500));
        msg = 'Error interno del servidor. El backend no está respondiendo correctamente.';
        errorData = { 
          _isHtmlError: true, 
          _htmlContent: payload.substring(0, 1000), // Solo los primeros 1000 caracteres
          _status: response.status 
        };
      } else {
        msg = payload;
      }
    } else if (payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      
      // Manejar diferentes estructuras de error del backend
      if (p.detail && typeof p.detail === 'string') {
        msg = p.detail;
      } else if (Array.isArray(p.non_field_errors)) {
        msg = p.non_field_errors.join(', ');
      } else if (p.error && typeof p.error === 'string') {
        msg = p.error;
      } else if (p.message && typeof p.message === 'string') {
        msg = p.message;
      } else {
        // Para errores 500, intentar extraer información más útil
        if (response.status === 500) {
          msg = 'Error interno del servidor. Por favor, intenta nuevamente.';
          errorData = { ...p, _isServerError: true };
        } else {
          msg = JSON.stringify(p);
        }
      }
    }
    
    const err: ApiError = {
      status: response.status,
      data: errorData,
      message: msg || `HTTP ${response.status}`,
    };
    throw err;
  }

  return payload;
}

export const apiClient = {
  async get<T = unknown>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'omit',
    });
    return handleResponse(res);
  },

  async post<TReq = unknown, TRes = unknown>(endpoint: string, data: TReq): Promise<TRes> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'omit',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async patch<TReq = unknown, TRes = unknown>(endpoint: string, data?: TReq): Promise<TRes> {
    const hasBody = data !== undefined;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...getAuthHeaders(),
      },
      credentials: 'omit',
      ...(hasBody ? { body: JSON.stringify(data) } as RequestInit : {}),
    });
    return handleResponse(res);
  },

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'omit',
    });
    return handleResponse(res);
  },
};