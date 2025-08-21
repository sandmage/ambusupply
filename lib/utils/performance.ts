export const isDevelopment = process.env.NODE_ENV === "development"

// Safe console logging that only runs in development
export const devLog = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log("[v0]", ...args)
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error("[v0]", ...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn("[v0]", ...args)
    }
  },
}

// Optimized array operations that combine multiple passes into single operations
export function filterAndSort<T>(items: T[], filterFn: (item: T) => boolean, sortFn: (a: T, b: T) => number): T[] {
  return items.filter(filterFn).sort(sortFn)
}

export function filterMapAndReduce<T, U, R>(
  items: T[],
  filterFn: (item: T) => boolean,
  mapFn: (item: T) => U,
  reduceFn: (acc: R, item: U) => R,
  initialValue: R,
): R {
  return items.filter(filterFn).map(mapFn).reduce(reduceFn, initialValue)
}

// Debounce utility for search inputs
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Memoization utility for expensive computations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Batch operations utility
export function batchOperations<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<void>,
): Promise<void[]> {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return Promise.all(batches.map(operation))
}
