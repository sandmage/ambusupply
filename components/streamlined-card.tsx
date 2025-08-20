"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface StreamlinedCardProps {
  variant?: "default" | "glass" | "stat" | "action"
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function StreamlinedCard({ variant = "default", children, className, onClick }: StreamlinedCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "glass":
        return "apple-glass"
      case "stat":
        return "apple-card border-l-4 border-l-blue-500"
      case "action":
        return "apple-card cursor-pointer hover:shadow-lg transition-all duration-200"
      default:
        return "apple-card"
    }
  }

  return (
    <div className={cn(getVariantStyles(), className)} onClick={onClick}>
      {children}
    </div>
  )
}
