"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface GestureShortcutsProps {
  children: React.ReactNode
}

export function GestureShortcuts({ children }: GestureShortcutsProps) {
  const router = useRouter()
  const [gestureSequence, setGestureSequence] = useState<string[]>([])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle keyboard shortcuts for desktop
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "1":
            e.preventDefault()
            router.push("/")
            break
          case "2":
            e.preventDefault()
            router.push("/inventory")
            break
          case "3":
            e.preventDefault()
            router.push("/fleet")
            break
          case "4":
            e.preventDefault()
            router.push("/orders")
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  // Touch gesture patterns for mobile
  const handleGesturePattern = (pattern: string[]) => {
    const patternString = pattern.join("")

    // Define gesture patterns
    const patterns = {
      rightright: () => router.push("/inventory"), // Double swipe right to inventory
      leftleft: () => router.push("/"), // Double swipe left to dashboard
      upup: () => router.push("/fleet"), // Double swipe up to fleet
      downdown: () => router.push("/orders"), // Double swipe down to orders
    }

    const matchedPattern = patterns[patternString as keyof typeof patterns]
    if (matchedPattern) {
      matchedPattern()
      setGestureSequence([])
    }
  }

  const addGesture = (direction: string) => {
    const newSequence = [...gestureSequence, direction].slice(-2) // Keep only last 2 gestures
    setGestureSequence(newSequence)

    if (newSequence.length === 2) {
      handleGesturePattern(newSequence)
    }
  }

  return (
    <div
      onTouchStart={(e) => {
        // Reset gesture sequence on new touch
        if (gestureSequence.length === 0) {
          setTimeout(() => setGestureSequence([]), 2000) // Clear after 2 seconds
        }
      }}
    >
      {children}
    </div>
  )
}
