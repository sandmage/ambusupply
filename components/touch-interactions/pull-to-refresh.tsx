"use client"

import type React from "react"

import { useState, useRef } from "react"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({ children, onRefresh, threshold = 80, className = "" }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && startY > 0) {
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY)
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }

  const refreshProgress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: pullDistance > 20 ? 1 : 0,
        }}
      >
        <div className="flex items-center space-x-2 text-muted-foreground">
          <RefreshCw
            className={`h-5 w-5 transition-transform duration-200 ${
              isRefreshing ? "animate-spin" : shouldTrigger ? "rotate-180" : ""
            }`}
            style={{ transform: `rotate(${refreshProgress * 180}deg)` }}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? "Refreshing..." : shouldTrigger ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="transition-transform duration-200" style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}
