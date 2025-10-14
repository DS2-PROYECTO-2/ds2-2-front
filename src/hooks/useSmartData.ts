/**
 * Hook para manejar datos con caché inteligente y actualizaciones pasivas
 * Combina el caché con actualizaciones pasivas para una experiencia fluida
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager } from '../utils/cacheManager';
import { usePassiveUpdates } from './usePassiveUpdates';

interface SmartDataOptions<T> {
  /**
   * Función para obtener datos frescos
   */
  fetcher: () => Promise<T>;
  
  /**
   * Clave única para el caché
   */
  cacheKey: string;
  
  /**
   * TTL del caché en milisegundos
   */
  ttl?: number;
  
  /**
   * Datos de fallback si falla la carga
   */
  fallbackData?: T;
  
  /**
   * Habilitar actualizaciones pasivas
   */
  enablePassiveUpdates?: boolean;
  
  /**
   * Intervalo mínimo entre actualizaciones pasivas
   */
  passiveUpdateInterval?: number;
  
  /**
   * Dependencias que invalidan el caché
   */
  dependencies?: unknown[];
  
  /**
   * Habilitar pre-carga de datos
   */
  enablePreload?: boolean;
}

interface SmartDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  isStale: boolean;
}

export function useSmartData<T>(options: SmartDataOptions<T>) {
  const {
    fetcher,
    cacheKey,
    ttl = 5 * 60 * 1000, // 5 minutos por defecto
    fallbackData,
    enablePassiveUpdates = true,
    passiveUpdateInterval = 30000, // 30 segundos
    dependencies = [],
    enablePreload = false
  } = options;

  const [state, setState] = useState<SmartDataState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isStale: false
  });

  const isInitialLoad = useRef(true);

  /**
   * Cargar datos desde caché o API
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    // Evitar cargas múltiples simultáneas
    if (state.loading) return;

    // Verificar si los datos están en caché
    if (!forceRefresh) {
      const cached = cacheManager.get<T>(cacheKey);
      if (cached) {
        setState(prev => ({
          ...prev,
          data: cached,
          lastUpdated: Date.now(),
          isStale: false
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcher();
      
      // Guardar en caché
      cacheManager.set(cacheKey, data, ttl);
      
      setState(prev => ({
        ...prev,
        data,
        loading: false,
        lastUpdated: Date.now(),
        isStale: false
      }));
    } catch (error) {
      console.warn(`Error cargando datos para ${cacheKey}:`, error);
      
      // Usar datos de fallback si están disponibles
      if (fallbackData) {
        setState(prev => ({
          ...prev,
          data: fallbackData,
          loading: false,
          error: null,
          isStale: true
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error
        }));
      }
    }
  }, [fetcher, cacheKey, ttl, fallbackData, state.loading]);

  /**
   * Actualización pasiva inteligente
   */
  const { forceUpdate } = usePassiveUpdates({
    minUpdateInterval: passiveUpdateInterval,
    enableVisibilityUpdates: enablePassiveUpdates,
    enableFocusUpdates: false,
    shouldUpdate: () => {
      // Solo actualizar si los datos son antiguos
      const now = Date.now();
      const timeSinceLastUpdate = state.lastUpdated ? now - state.lastUpdated : Infinity;
      return timeSinceLastUpdate > passiveUpdateInterval;
    },
    onUpdate: () => loadData(true)
  });

  /**
   * Invalidar caché y recargar
   */
  const invalidateAndReload = useCallback(async () => {
    cacheManager.invalidate(cacheKey);
    await loadData(true);
  }, [cacheKey, loadData]);

  /**
   * Pre-cargar datos en background
   */
  const preloadData = useCallback(async () => {
    if (enablePreload && !state.data) {
      try {
        const data = await fetcher();
        cacheManager.set(cacheKey, data, ttl);
      } catch (error) {
        console.warn(`Error pre-cargando datos para ${cacheKey}:`, error);
      }
    }
  }, [fetcher, cacheKey, ttl, enablePreload, state.data]);

  // Carga inicial
  useEffect(() => {
    if (isInitialLoad.current) {
      loadData();
      isInitialLoad.current = false;
    }
  }, [loadData]);

  // Invalidar caché cuando cambien las dependencias
  useEffect(() => {
    if (dependencies.length > 0) {
      cacheManager.invalidate(cacheKey);
      loadData(true);
    }
  }, dependencies);

  // Pre-carga en background
  useEffect(() => {
    if (enablePreload) {
      const timer = setTimeout(preloadData, 1000);
      return () => clearTimeout(timer);
    }
  }, [preloadData, enablePreload]);

  // Marcar datos como obsoletos después del TTL
  useEffect(() => {
    if (state.lastUpdated) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, isStale: true }));
      }, ttl);
      
      return () => clearTimeout(timer);
    }
  }, [state.lastUpdated, ttl]);

  return {
    ...state,
    refetch: () => loadData(true),
    invalidate: () => cacheManager.invalidate(cacheKey),
    invalidateAndReload,
    forceUpdate,
    isInitialLoad: isInitialLoad.current
  };
}

/**
 * Hook simplificado para datos con caché básico
 */
export function useCachedData<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  options: {
    ttl?: number;
    fallbackData?: T;
    dependencies?: unknown[];
  } = {}
) {
  return useSmartData({
    fetcher,
    cacheKey,
    ttl: options.ttl || 5 * 60 * 1000,
    fallbackData: options.fallbackData,
    dependencies: options.dependencies || [],
    enablePassiveUpdates: false
  });
}

export default useSmartData;
