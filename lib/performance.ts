// Performance monitoring utilities for HiKo

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observer?: PerformanceObserver

  constructor() {
    if (typeof window !== 'undefined') {
      this.initPerformanceObserver()
      this.measureWebVitals()
    }
  }

  private initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.duration || (entry as any).value,
            timestamp: Date.now(),
            url: window.location.pathname
          })
        }
      })

      // Observe Core Web Vitals
      try {
        this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
        this.observer.observe({ entryTypes: ['navigation', 'resource'] })
      } catch (e) {
        console.warn('Performance observer not fully supported:', e)
      }
    }
  }

  private measureWebVitals() {
    // Cumulative Layout Shift (CLS)
    let cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value
          this.recordMetric({
            name: 'CLS',
            value: cls,
            timestamp: Date.now(),
            url: window.location.pathname
          })
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })

    // First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: 'FCP',
          value: entry.startTime,
          timestamp: Date.now(),
          url: window.location.pathname
        })
      }
    }).observe({ entryTypes: ['paint'] })
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Log critical metrics in development
    if (process.env.NODE_ENV === 'development') {
      if (metric.name === 'CLS' && metric.value > 0.1) {
        console.warn(`High CLS detected: ${metric.value} on ${metric.url}`)
      }
      if (metric.name === 'LCP' && metric.value > 2500) {
        console.warn(`Slow LCP detected: ${metric.value}ms on ${metric.url}`)
      }
      if (metric.name === 'FID' && metric.value > 100) {
        console.warn(`High FID detected: ${metric.value}ms on ${metric.url}`)
      }
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name)
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }

  clearMetrics() {
    this.metrics = []
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Image lazy loading intersection observer
export function createImageLazyLoader() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
          }
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.1
    }
  )
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available in production build with: npm run build && npm run analyze')
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
    const memory = (window.performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    }
  }
  return null
}

// Performance timing helper
export function timeFunction<T>(fn: () => T, name: string): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  performanceMonitor.recordMetric({
    name: `function_${name}`,
    value: end - start,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.pathname : undefined
  })
  
  return result
}

// Async function timing
export async function timeAsyncFunction<T>(fn: () => Promise<T>, name: string): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  
  performanceMonitor.recordMetric({
    name: `async_function_${name}`,
    value: end - start,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.pathname : undefined
  })
  
  return result
}