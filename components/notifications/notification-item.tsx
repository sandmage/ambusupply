"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, AlertTriangle, AlertCircle, Info } from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

// Define inline Check icon to avoid import issues
const CheckIcon = ({ className = "", size = 16 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
)

// Define inline CheckCircle icon to avoid import issues
const CheckCircleIcon = ({ className = "", size = 16 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
)

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

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

const typeIcons = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  SUCCESS: CheckCircleIcon, // Using inline icon
}

const typeColors = {
  INFO: "text-blue-500",
  WARNING: "text-yellow-500",
  ERROR: "text-red-500",
  SUCCESS: "text-green-500",
}

const priorityColors = {
  LOW: "border-l-gray-300",
  NORMAL: "border-l-blue-300",
  HIGH: "border-l-orange-300",
  URGENT: "border-l-red-500",
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const Icon = typeIcons[notification.type]
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })

  return (
    <div
      className={cn(
        "p-4 border-l-4 hover:bg-muted/50 transition-colors",
        priorityColors[notification.priority],
        !notification.isRead && "bg-muted/30",
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("mt-0.5", typeColors[notification.type])}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn("text-sm font-medium", !notification.isRead && "font-semibold")}>
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
                {notification.priority === "HIGH" && (
                  <Badge variant="secondary" className="text-xs">
                    High
                  </Badge>
                )}
                {notification.priority === "URGENT" && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
                {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}
              </div>
            </div>

            <div className="flex items-center space-x-1 ml-2">
              {!notification.isRead && (
                <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)} className="h-6 w-6 p-0">
                  <CheckIcon className="h-3 w-3" /> {/* Using inline icon */}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
