"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnifiedActionButtonProps {
  variant?: "add" | "edit" | "delete" | "external" | "primary" | "secondary"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  href?: string
}

export function UnifiedActionButton({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled,
  className,
  href,
}: UnifiedActionButtonProps) {
  const getIcon = () => {
    switch (variant) {
      case "add":
        return <Plus className="h-4 w-4" />
      case "edit":
        return <Edit className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      case "external":
        return <ExternalLink className="h-4 w-4" />
      default:
        return null
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "add":
      case "primary":
        return "apple-button"
      case "secondary":
        return "apple-button-secondary"
      case "delete":
        return "bg-red-600 text-white hover:bg-red-700"
      case "external":
        return "apple-button-outline"
      default:
        return "apple-button"
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-xs"
      case "lg":
        return "px-6 py-3 text-base"
      default:
        return "px-4 py-2 text-sm"
    }
  }

  const buttonContent = (
    <>
      {getIcon()}
      <span className={getIcon() ? "ml-2" : ""}>{children}</span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          getVariantStyles(),
          getSizeStyles(),
          "no-underline inline-flex items-center justify-center",
          className,
        )}
      >
        {buttonContent}
      </a>
    )
  }

  return (
    <Button onClick={onClick} disabled={disabled} className={cn(getVariantStyles(), getSizeStyles(), className)}>
      {buttonContent}
    </Button>
  )
}
