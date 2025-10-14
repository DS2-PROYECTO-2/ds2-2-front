import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { performanceOptimizer } from '../performanceOptimizer'
import { cacheManager } from '../cacheManager'

// Mock del cacheManager
vi.mock('../cacheManager', () => ({
  cacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    cleanup: vi.fn(),
    getStats: vi.fn()
  }
}))

// Mock de fetch
global.fetch = vi.fn()

// Mock de performance
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: vi.fn(),
    now: vi.fn(() => Date.now())
  },
  writable: true
})

// Mock de IntersectionObserver
const mockObserver = {
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}

global.IntersectionObserver = vi.fn().mockImplementation(() => mockObserver)

// Mock de setInterval y clearInterval
vi.spyOn(global, 'setInterval').mockImplementation(vi.fn())
vi.spyOn(global, 'clearInterval').mockImplementation(vi.fn())

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset DOM
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('global instance', () => {
    it('should export global instance', () => {
      expect(performanceOptimizer).toBeDefined()
      expect(typeof performanceOptimizer).toBe('object')
    })

    it('should have default configuration', () => {
      expect(performanceOptimizer).toBeDefined()
    })
  })

  describe('preloadCriticalData', () => {
    it('should preload data when enabled', async () => {
      const mockResponse = { data: 'test' }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      vi.mocked(cacheManager.get).mockReturnValue(null)

      await performanceOptimizer.preloadCriticalData()

      expect(fetch).toHaveBeenCalled()
      expect(cacheManager.set).toHaveBeenCalled()
    })

    it('should use cached data when available', async () => {
      const cachedData = { data: 'cached' }
      vi.mocked(cacheManager.get).mockReturnValue(cachedData)

      await performanceOptimizer.preloadCriticalData()

      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      vi.mocked(cacheManager.get).mockReturnValue(null)
      
      // Should not throw
      await expect(performanceOptimizer.preloadCriticalData()).resolves.toBeUndefined()
    })
  })

      describe('optimizeImages', () => {
        it('should optimize images when enabled', () => {
          // Add test images to DOM
          const img1 = document.createElement('img')
          img1.setAttribute('data-src', 'test1.jpg')
          document.body.appendChild(img1)

          const img2 = document.createElement('img')
          img2.setAttribute('data-src', 'test2.jpg')
          document.body.appendChild(img2)

          // Mock the IntersectionObserver constructor to return our mock
          const mockObserve = vi.fn()
          const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
            observe: mockObserve,
            unobserve: vi.fn(),
            disconnect: vi.fn()
          }))
          
          global.IntersectionObserver = mockIntersectionObserver

          performanceOptimizer.optimizeImages()

          expect(mockIntersectionObserver).toHaveBeenCalled()
        })
      })

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      performanceOptimizer.cleanup()

      expect(cacheManager.cleanup).toHaveBeenCalled()
    })

    it('should call garbage collection if available', () => {
      // Mock window.gc
      const mockGc = vi.fn()
      Object.defineProperty(window, 'gc', {
        value: mockGc,
        writable: true
      })

      performanceOptimizer.cleanup()

      expect(mockGc).toHaveBeenCalled()
    })
  })

      describe('optimize', () => {
        it('should run all optimizations', () => {
          const preloadSpy = vi.spyOn(performanceOptimizer, 'preloadCriticalData').mockImplementation(() => Promise.resolve())
          const imagesSpy = vi.spyOn(performanceOptimizer, 'optimizeImages').mockImplementation(() => {})

          performanceOptimizer.optimize()

          expect(preloadSpy).toHaveBeenCalled()
          expect(imagesSpy).toHaveBeenCalled()
          // The optimize method should call the main optimization functions
          expect(preloadSpy).toHaveBeenCalledTimes(1)
          expect(imagesSpy).toHaveBeenCalledTimes(1)
        })
      })

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', () => {
      const mockNavigation = {
        loadEventEnd: 1000,
        loadEventStart: 500,
        domContentLoadedEventEnd: 800,
        domContentLoadedEventStart: 400
      }

      const mockPaint = [
        { name: 'first-paint', startTime: 200 },
        { name: 'first-contentful-paint', startTime: 300 }
      ]

      vi.mocked(performance.getEntriesByType).mockImplementation((type) => {
        if (type === 'navigation') return [mockNavigation]
        if (type === 'paint') return mockPaint
        return []
      })

      vi.mocked(cacheManager.getStats).mockReturnValue({ hits: 10, misses: 5 })

      const metrics = performanceOptimizer.getPerformanceMetrics()

      expect(metrics).toEqual({
        loadTime: 500,
        domContentLoaded: 400,
        firstPaint: 200,
        firstContentfulPaint: 300,
        cacheStats: { hits: 10, misses: 5 }
      })
    })
  })
})
