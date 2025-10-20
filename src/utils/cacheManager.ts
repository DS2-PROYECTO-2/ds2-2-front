/**
 * Gestor de caché inteligente para evitar recargas innecesarias
 * Implementa estrategias de caché con TTL y invalidación selectiva
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  enablePersistent?: boolean;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: Required<CacheConfig>;
  private persistentKeys = new Set<string>();

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: config.maxSize || 100,
      enablePersistent: config.enablePersistent || true
    };
  }

  /**
   * Obtiene datos del caché si son válidos
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Almacena datos en el caché
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Limpiar caché si excede el tamaño máximo
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, entry);

    // Guardar en localStorage si es persistente
    if (this.config.enablePersistent && this.persistentKeys.has(key)) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (error) {
        console.warn('No se pudo guardar en localStorage:', error);
      }
    }
  }

  /**
   * Marca una clave como persistente
   */
  markPersistent(key: string): void {
    this.persistentKeys.add(key);
  }

  /**
   * Invalida una clave específica
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    if (this.config.enablePersistent) {
      localStorage.removeItem(`cache_${key}`);
    }
  }

  /**
   * Invalida múltiples claves con patrón
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
    if (this.config.enablePersistent) {
      // Limpiar localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Carga datos desde localStorage al inicializar
   */
  loadFromStorage(): void {
    if (!this.config.enablePersistent) return;

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('cache_')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          const cacheKey = key.replace('cache_', '');
          
          // Verificar si no ha expirado
          if (Date.now() - entry.timestamp <= entry.ttl) {
            this.cache.set(cacheKey, entry);
          } else {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      persistentKeys: this.persistentKeys.size
    };
  }
}

// Instancia global del caché
export const cacheManager = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 50,
  enablePersistent: true
});

// Cargar datos persistentes al inicializar
cacheManager.loadFromStorage();

/**
 * Hook para usar el caché en componentes React
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    dependencies?: unknown[];
  } = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!options.enabled) return;

    // Intentar obtener del caché primero
    const cached = cacheManager.get<T>(key);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cacheManager.set(key, result, options.ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.enabled, options.ttl]);

  const refetch = React.useCallback(async () => {
    cacheManager.invalidate(key);
    await fetchData();
  }, [key, fetchData]);

  const invalidate = React.useCallback(() => {
    cacheManager.invalidate(key);
    setData(null);
  }, [key]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData, options.dependencies]);

  return { data, loading, error, refetch, invalidate };
}

export default cacheManager;
