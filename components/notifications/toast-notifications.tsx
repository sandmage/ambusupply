"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

interface ToastNotificationProps {
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
}

export function showToastNotification({ title, message, type, priority }: ToastNotificationProps) {
  const variant = type === "ERROR" ? "destructive" : "default"

  toast({
    title,
    description: message,
    variant,
    duration: priority === "URGENT" ? 10000 : priority === "HIGH" ? 7000 : 5000,
  })
}

export function useToastNotifications() {
  useEffect(() => {
    const handleNotification = (event: CustomEvent<ToastNotificationProps>) => {
      showToastNotification(event.detail)
    }

    window.addEventListener("notification" as any, handleNotification)
    return () => window.removeEventListener("notification" as any, handleNotification)
  }, [])
}
