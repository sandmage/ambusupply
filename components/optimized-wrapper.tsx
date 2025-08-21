"use client"

import { memo, useMemo, useCallback, type ReactNode } from "react"

interface OptimizedWrapperProps {
  children: ReactNode
  dependencies?: any[]
  shouldUpdate?: (prevProps: any, nextProps: any) => boolean
}

export const OptimizedWrapper = memo<OptimizedWrapperProps>(
  ({ children, dependencies = [] }) => {
    const memoizedChildren = useMemo(() => children, dependencies)

    return <>{memoizedChildren}</>
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.dependencies) === JSON.stringify(nextProps.dependencies)
  },
)

OptimizedWrapper.displayName = "OptimizedWrapper"

export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useMemo(() => performance.now(), [])

  const logPerformance = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${componentName}: ${performance.now() - startTime}ms`)
    }
  }, [componentName, startTime])

  return { logPerformance }
}
