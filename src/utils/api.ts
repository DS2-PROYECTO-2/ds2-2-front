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
    // Manejo automático de 401/403
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    if (isBrowser) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      if (response.status === 403) {
        window.location.href = '/403';
      }
    }
    
    let msg = '';
    if (typeof payload === 'string') {
      msg = payload;
    } else if (payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      msg =
        (typeof p.detail === 'string' && p.detail) ||
        (Array.isArray(p.non_field_errors) && p.non_field_errors.join(', ')) ||
        JSON.stringify(p);
    }
    const err: ApiError = {
      status: response.status,
      data: payload,
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
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
    });
    return handleResponse(res);
  },
};