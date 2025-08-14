"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Truck,
  Package,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  ShoppingCart,
  Wrench,
  Info,
} from "@/components/ui/icons"
import { apiClient } from "@/lib/api/client"

interface ActivityItem {
  id: string
  type: "deployment" | "supply" | "alert" | "maintenance" | "order" | "check" | "medication"
  message: string
  shortMessage: string
  time: string
  status: "active" | "completed" | "warning" | "error"
  icon: string
  metadata?: Record<string, any>
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActivities()
    // Refresh activities every 30 seconds
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadActivities = async () => {
    try {
      setError(null)
      const response = await apiClient.get<ActivityItem[]>("/activities?limit=10")
      const activitiesData = response.data || response
      setActivities(Array.isArray(activitiesData) ? activitiesData : [])
    } catch (err) {
      console.error("Failed to load activities:", err)
      setError("Failed to load recent activities")
      setActivities([
        {
          id: "fallback-1",
          type: "deployment",
          message: "Ambulance Unit 12 deployed to Emergency Call #4521",
          shortMessage: "Unit 12 deployed",
          time: "2m ago",
          status: "active",
          icon: "Truck",
        },
        {
          id: "fallback-2",
          type: "supply",
          message: "Medical supplies restocked - Bandages (500 units)",
          shortMessage: "Bandages restocked",
          time: "15m ago",
          status: "completed",
          icon: "Package",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Truck,
      Package,
      AlertCircle,
      CheckCircle,
      ShoppingCart,
      Wrench,
      Info,
    }
    return icons[iconName] || Info
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "warning":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-6">
          <CardTitle className="flex items-center space-x-2 font-heading text-lg sm:text-xl">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-6">
        <CardTitle className="flex items-center space-x-2 font-heading text-lg sm:text-xl">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
          {error && (
            <Badge variant="destructive" className="ml-2 text-xs">
              Error
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-2 sm:space-y-4 mobile-scroll max-h-80 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activities</p>
            </div>
          ) : (
            activities.map((activity) => {
              const IconComponent = getIcon(activity.icon)
              return (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors cursor-pointer touch-target group"
                >
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      <span className="sm:hidden">{activity.shortMessage}</span>
                      <span className="hidden sm:inline">{activity.message}</span>
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
