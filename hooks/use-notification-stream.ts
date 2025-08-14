"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { showToastNotification } from "@/components/notifications/toast-notifications"

interface StreamMessage {
  type: string
  data?: any
  message?: string
}

export function useNotificationStream() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<StreamMessage | null>(null)
  const { isAuthenticated } = useAuthStore()

  const connect = useCallback(() => {
    if (!isAuthenticated || typeof window === "undefined") return

    const eventSource = new EventSource("/api/notifications/stream")

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log("Connected to notification stream")
    }

    eventSource.onmessage = (event) => {
      try {
        const message: StreamMessage = JSON.parse(event.data)
        setLastMessage(message)

        if (message.type === "notification" && message.data) {
          showToastNotification(message.data)

          // Trigger custom event for notification center to refresh
          window.dispatchEvent(
            new CustomEvent("notification-received", {
              detail: message.data,
            }),
          )
        }
      } catch (error) {
        console.error("Failed to parse notification message:", error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      console.log("Notification stream disconnected")
    }

    return eventSource
  }, [isAuthenticated])

  useEffect(() => {
    const eventSource = connect()

    return () => {
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [connect])

  return {
    isConnected,
    lastMessage,
  }
}
