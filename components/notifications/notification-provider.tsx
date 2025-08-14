"use client"

import type React from "react"

import { useNotificationStream } from "@/hooks/use-notification-stream"
import { useToastNotifications } from "./toast-notifications"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useNotificationStream()
  useToastNotifications()

  return <>{children}</>
}
