"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck } from "@/components/ui/icons"
import { notificationsService } from "@/lib/api/services"
import { NotificationItem } from "./notification-item"
import { useNotificationStream } from "@/hooks/use-notification-stream"

interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  isRead: boolean
  createdAt: string
  data?: any
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const { isConnected } = useNotificationStream()

  useEffect(() => {
    const handleNewNotification = () => {
      if (isOpen) {
        loadNotifications()
      }
      loadUnreadCount()
    }

    window.addEventListener("notification-received", handleNewNotification)
    return () => window.removeEventListener("notification-received", handleNewNotification)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
    loadUnreadCount()
  }, [isOpen])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await notificationsService.getNotifications({ limit: 20 })
      if (response.success) {
        setNotifications(response.data.data || [])
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsService.getUnreadCount()
      if (response.success) {
        setUnreadCount(response.data.count || 0)
      }
    } catch (error) {
      console.error("Failed to load unread count:", error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      const deletedNotification = notifications.find((n) => n.id === id)
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative touch-manipulation">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <div
            className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Notifications</h3>
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-auto p-1">
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuHeader>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
