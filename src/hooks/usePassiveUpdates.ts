/**
 * Hook para manejar actualizaciones pasivas y evitar recargas innecesarias
 * Implementa estrategias inteligentes de actualización basadas en:
 * - Tiempo de inactividad
 * - Cambios en los datos
 * - Visibilidad de la página
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface PassiveUpdateConfig {
  /**
   * Tiempo mínimo entre actualizaciones automáticas (ms)
   */
  minUpdateInterval?: number;
  
  /**
   * Tiempo de inactividad antes de permitir actualizaciones (ms)
   */
  inactivityThreshold?: number;
  
  /**
   * Habilitar actualizaciones cuando la página vuelve a ser visible
   */
  enableVisibilityUpdates?: boolean;
  
  /**
   * Habilitar actualizaciones cuando la ventana recibe foco
   */
  enableFocusUpdates?: boolean;
  
  /**
   * Función para verificar si los datos necesitan actualización
   */
  shouldUpdate?: () => boolean;
  
  /**
   * Callback para actualizar datos
   */
  onUpdate: () => Promise<void> | void;
}

interface PassiveUpdateState {
  isUpdating: boolean;
  lastUpdate: number | null;
  isPageVisible: boolean;
  isPageFocused: boolean;
  inactivityStart: number | null;
}

export function usePassiveUpdates(config: PassiveUpdateConfig) {
  const {
    minUpdateInterval = 30000, // 30 segundos
    inactivityThreshold = 10000, // 10 segundos
    enableVisibilityUpdates = true,
    enableFocusUpdates = true,
    shouldUpdate,
    onUpdate
  } = config;

  const [state, setState] = useState<PassiveUpdateState>({
    isUpdating: false,
    lastUpdate: null,
    isPageVisible: !document.hidden,
    isPageFocused: document.hasFocus(),
    inactivityStart: null
  });

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Verifica si se puede realizar una actualización
   */
  const canUpdate = useCallback(() => {
    const now = Date.now();
    
    // No actualizar si ya está actualizando
    if (state.isUpdating) return false;
    
    // No actualizar si no ha pasado el tiempo mínimo
    if (state.lastUpdate && (now - state.lastUpdate) < minUpdateInterval) {
      return false;
    }
    
    // Verificar función personalizada de actualización
    if (shouldUpdate && !shouldUpdate()) {
      return false;
    }
    
    return true;
  }, [state.isUpdating, state.lastUpdate, minUpdateInterval, shouldUpdate]);

  /**
   * Ejecuta la actualización si es posible
   */
  const performUpdate = useCallback(async () => {
    if (!canUpdate()) return;

    setState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      await onUpdate();
      setState(prev => ({ 
        ...prev, 
        lastUpdate: Date.now(),
        isUpdating: false 
      }));
    } catch (error) {
      console.warn('Error en actualización pasiva:', error);
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [canUpdate, onUpdate]);

  /**
   * Programa una actualización diferida
   */
  const scheduleUpdate = useCallback((delay: number = 1000) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      performUpdate();
    }, delay);
  }, [performUpdate]);

  /**
   * Maneja cambios en la visibilidad de la página
   */
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    setState(prev => ({ ...prev, isPageVisible: isVisible }));
    
    if (enableVisibilityUpdates && isVisible && canUpdate()) {
      // Actualizar después de un breve delay para evitar recargas inmediatas
      scheduleUpdate(2000);
    }
  }, [enableVisibilityUpdates, canUpdate, scheduleUpdate]);

  /**
   * Maneja cambios en el foco de la ventana
   */
  const handleFocusChange = useCallback(() => {
    const isFocused = document.hasFocus();
    setState(prev => ({ ...prev, isPageFocused: isFocused }));
    
    if (enableFocusUpdates && isFocused && canUpdate()) {
      // Solo actualizar si la página ha estado inactiva por un tiempo
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity > inactivityThreshold) {
        scheduleUpdate(1000);
      }
    }
  }, [enableFocusUpdates, canUpdate, scheduleUpdate, inactivityThreshold]);

  /**
   * Registra actividad del usuario
   */
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setState(prev => ({ ...prev, inactivityStart: null }));
    
    // Limpiar timeout de inactividad
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  /**
   * Maneja el inicio de inactividad
   */
  const handleInactivityStart = useCallback(() => {
    setState(prev => ({ ...prev, inactivityStart: Date.now() }));
  }, []);

  /**
   * Fuerza una actualización inmediata
   */
  const forceUpdate = useCallback(async () => {
    setState(prev => ({ ...prev, lastUpdate: null }));
    await performUpdate();
  }, [performUpdate]);

  // Efectos para manejar eventos
  useEffect(() => {
    // Eventos de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Eventos de foco
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);
    
    // Eventos de actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, recordActivity, { passive: true });
    });
    
    // Timeout para detectar inactividad
    inactivityTimeoutRef.current = setTimeout(handleInactivityStart, inactivityThreshold);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, recordActivity);
      });
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [handleVisibilityChange, handleFocusChange, recordActivity, handleInactivityStart, inactivityThreshold]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    forceUpdate,
    scheduleUpdate,
    canUpdate: canUpdate()
  };
}

/**
 * Hook simplificado para actualizaciones pasivas básicas
 */
export function useSmartRefresh(
  updateFn: () => Promise<void> | void,
  options: {
    enabled?: boolean;
    minInterval?: number;
    onVisibilityChange?: boolean;
    onFocus?: boolean;
  } = {}
) {
  const {
    enabled = true,
    minInterval = 30000,
    onVisibilityChange = true,
    onFocus = false
  } = options;

  return usePassiveUpdates({
    minUpdateInterval: minInterval,
    enableVisibilityUpdates: enabled && onVisibilityChange,
    enableFocusUpdates: enabled && onFocus,
    onUpdate: updateFn
  });
}

export default usePassiveUpdates;
