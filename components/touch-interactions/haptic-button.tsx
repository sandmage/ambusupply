"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { forwardRef } from "react"

interface HapticButtonProps extends React.ComponentProps<typeof Button> {
  hapticType?: "light" | "medium" | "heavy" | "success" | "warning" | "error"
}

export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ hapticType = "light", onClick, className = "", ...props }, ref) => {
    const triggerHaptic = (type: string) => {
      // Simulate haptic feedback for web (would be actual haptic on native)
      if ("vibrate" in navigator) {
        switch (type) {
          case "light":
            navigator.vibrate(10)
            break
          case "medium":
            navigator.vibrate(20)
            break
          case "heavy":
            navigator.vibrate(50)
            break
          case "success":
            navigator.vibrate([10, 50, 10])
            break
          case "warning":
            navigator.vibrate([20, 100, 20])
            break
          case "error":
            navigator.vibrate([50, 100, 50])
            break
        }
      }
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic(hapticType)
      onClick?.(e)
    }

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        className={`touch-target active:scale-95 transition-all duration-150 ${className}`}
        {...props}
      />
    )
  },
)

HapticButton.displayName = "HapticButton"
