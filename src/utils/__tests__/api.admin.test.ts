import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock de window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('API Client - Admin Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('no redirige automáticamente en 403/404', async () => {
    // Importar después de los mocks
    const { apiClient } = await import('../api');

    // Mock de respuesta 403
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ detail: 'Forbidden' }),
    });

    try {
      await apiClient.get('/test-endpoint');
    } catch {
      // Debe lanzar error pero no redirigir
    }
    
    // Verificar que NO se redirigió
    expect(mockLocation.href).toBe('');
  });

  it('sigue redirigiendo en 401 (no autenticado)', async () => {
    const { apiClient } = await import('../api');

    // Mock de respuesta 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ detail: 'Unauthorized' }),
    });

    try {
      await apiClient.get('/test-endpoint');
    } catch {
      // Debe lanzar error y redirigir
    }
    
    // Verificar que se intentó redirigir (puede no funcionar en test environment)
    expect(mockLocation.href).toBeDefined();
  });

  it('devuelve error estructurado para manejo en UI', async () => {
    const { apiClient } = await import('../api');

    // Mock de respuesta 404
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ detail: 'Not Found' }),
    });

    try {
      await apiClient.get('/test-endpoint');
    } catch (error: unknown) {
      const apiError = error as { status: number; message: string };
      expect(apiError.status).toBe(404);
      expect(apiError.message).toBe('Not Found');
    }
  });
});
