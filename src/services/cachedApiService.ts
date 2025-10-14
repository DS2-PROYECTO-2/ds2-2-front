/**
 * Servicio de API con caché inteligente para evitar llamadas innecesarias
 * Implementa estrategias de caché basadas en TTL y invalidación selectiva
 */

import { cacheManager } from '../utils/cacheManager';
import { apiClient } from '../utils/api';

interface CacheOptions {
  ttl?: number; // Time to live en milisegundos
  key?: string; // Clave personalizada para el caché
  forceRefresh?: boolean; // Forzar actualización
}

class CachedApiService {
  private defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * GET con caché
   */
  async get<T>(endpoint: string, options: CacheOptions = {}): Promise<T> {
    const cacheKey = options.key || `api_${endpoint}`;
    const ttl = options.ttl || this.defaultTTL;

    // Si no se fuerza refresh, intentar obtener del caché
    if (!options.forceRefresh) {
      const cached = cacheManager.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Hacer la llamada a la API
    const data = await apiClient.get<T>(endpoint);
    
    // Guardar en caché
    cacheManager.set(cacheKey, data, ttl);
    
    return data;
  }

  /**
   * POST con invalidación de caché
   */
  async post<T, R>(endpoint: string, data: T): Promise<R> {
    const result = await apiClient.post<T, R>(endpoint, data);
    
    // Invalidar caché relacionado
    this.invalidateRelatedCache(endpoint);
    
    return result;
  }

  /**
   * PATCH con invalidación de caché
   */
  async patch<T, R>(endpoint: string, data: T): Promise<R> {
    const result = await apiClient.patch<T, R>(endpoint, data);
    
    // Invalidar caché relacionado
    this.invalidateRelatedCache(endpoint);
    
    return result;
  }

  /**
   * DELETE con invalidación de caché
   */
  async delete(endpoint: string): Promise<void> {
    await apiClient.delete(endpoint);
    
    // Invalidar caché relacionado
    this.invalidateRelatedCache(endpoint);
  }

  /**
   * Invalidar caché relacionado basado en el endpoint
   */
  private invalidateRelatedCache(endpoint: string): void {
    // Invalidar patrones específicos basados en el endpoint
    if (endpoint.includes('/schedules/')) {
      cacheManager.invalidatePattern('api_.*schedule.*');
      cacheManager.invalidatePattern('api_.*calendar.*');
    }
    
    if (endpoint.includes('/rooms/')) {
      cacheManager.invalidatePattern('api_.*room.*');
      cacheManager.invalidatePattern('api_.*inventory.*');
    }
    
    if (endpoint.includes('/users/')) {
      cacheManager.invalidatePattern('api_.*user.*');
    }
    
    if (endpoint.includes('/reports/')) {
      cacheManager.invalidatePattern('api_.*report.*');
    }
    
    if (endpoint.includes('/entries/')) {
      cacheManager.invalidatePattern('api_.*entry.*');
      cacheManager.invalidatePattern('api_.*stats.*');
    }
  }

  /**
   * Obtener datos con caché y fallback
   */
  async getWithFallback<T>(
    endpoint: string, 
    fallbackData: T, 
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      return await this.get<T>(endpoint, options);
    } catch (error) {
      console.warn(`Error obteniendo datos de ${endpoint}, usando fallback:`, error);
      return fallbackData;
    }
  }

  /**
   * Pre-cargar datos importantes
   */
  async preloadCriticalData(): Promise<void> {
    const criticalEndpoints = [
      '/api/auth/dashboard/',
      '/api/rooms/',
      '/api/schedules/',
      '/api/notifications/'
    ];

    const preloadPromises = criticalEndpoints.map(endpoint => 
      this.get(endpoint, { ttl: 10 * 60 * 1000 }) // 10 minutos para datos críticos
        .catch(error => console.warn(`Error pre-cargando ${endpoint}:`, error))
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Limpiar caché expirado
   */
  cleanup(): void {
    cacheManager.cleanup();
  }

  /**
   * Limpiar todo el caché
   */
  clearCache(): void {
    cacheManager.clear();
  }

  /**
   * Obtener estadísticas del caché
   */
  getCacheStats() {
    return cacheManager.getStats();
  }
}

// Instancia global del servicio
export const cachedApiService = new CachedApiService();

// Limpiar caché expirado cada 5 minutos
setInterval(() => {
  cachedApiService.cleanup();
}, 5 * 60 * 1000);

export default cachedApiService;
