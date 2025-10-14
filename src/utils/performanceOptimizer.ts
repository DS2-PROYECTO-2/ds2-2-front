/**
 * Optimizador de rendimiento para la aplicación
 * Implementa estrategias para mejorar la experiencia del usuario
 */

import { cacheManager } from './cacheManager';

interface PerformanceConfig {
  enablePreloading?: boolean;
  enableLazyLoading?: boolean;
  enableVirtualScrolling?: boolean;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
}

class PerformanceOptimizer {
  private config: Required<PerformanceConfig>;
  private activeRequests = 0;
  private requestQueue: Array<() => Promise<unknown>> = [];

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enablePreloading: config.enablePreloading ?? true,
      enableLazyLoading: config.enableLazyLoading ?? true,
      enableVirtualScrolling: config.enableVirtualScrolling ?? false,
      maxConcurrentRequests: config.maxConcurrentRequests ?? 5,
      requestTimeout: config.requestTimeout ?? 10000
    };
  }

  /**
   * Pre-cargar datos críticos de la aplicación
   */
  async preloadCriticalData(): Promise<void> {
    if (!this.config.enablePreloading) return;

    const criticalData = [
      { key: 'user_profile', endpoint: '/api/auth/profile/' },
      { key: 'dashboard_data', endpoint: '/api/auth/dashboard/' },
      { key: 'notifications', endpoint: '/api/notifications/' },
      { key: 'rooms_list', endpoint: '/api/rooms/' }
    ];

    const preloadPromises = criticalData.map(async ({ key, endpoint }) => {
      try {
        // Verificar si ya está en caché
        const cached = cacheManager.get(key);
        if (cached) return;

        // Pre-cargar en background
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          cacheManager.set(key, data, 5 * 60 * 1000); // 5 minutos
        }
      } catch (error) {
        console.warn(`Error pre-cargando ${key}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Optimizar imágenes con lazy loading
   */
  optimizeImages(): void {
    if (!this.config.enableLazyLoading) return;

    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Limpiar recursos no utilizados
   */
  cleanup(): void {
    // Limpiar caché expirado
    cacheManager.cleanup();
    
    // Limpiar event listeners huérfanos
    this.cleanupEventListeners();
    
    // Forzar garbage collection si está disponible
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Limpiar event listeners huérfanos
   */
  private cleanupEventListeners(): void {
    // Esta función se puede expandir para limpiar listeners específicos
    // Por ahora, el navegador maneja esto automáticamente
  }

  /**
   * Optimizar el rendimiento de la aplicación
   */
  optimize(): void {
    // Pre-cargar datos críticos
    this.preloadCriticalData();
    
    // Optimizar imágenes
    this.optimizeImages();
    
    // Configurar limpieza automática
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  /**
   * Obtener métricas de rendimiento
   */
  getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      cacheStats: cacheManager.getStats()
    };
  }
}

// Instancia global del optimizador
export const performanceOptimizer = new PerformanceOptimizer({
  enablePreloading: true,
  enableLazyLoading: true,
  maxConcurrentRequests: 3
});

// Inicializar optimizaciones
performanceOptimizer.optimize();

export default performanceOptimizer;
