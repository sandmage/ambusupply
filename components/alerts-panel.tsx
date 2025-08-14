"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function AlertsPanel() {
  const router = useRouter()

  const alerts = [
    {
      id: 1,
      type: "critical",
      title: "Oxygen Tank Critical Low",
      message: "Only 3 units remaining",
      time: "5 min ago",
      action: "Order Now",
      onClick: () => router.push("/orders"),
    },
    {
      id: 2,
      type: "warning",
      title: "Ambulance Maintenance Due",
      message: "Unit 15 requires service",
      time: "1 hour ago",
      action: "Schedule",
      onClick: () => router.push("/fleet"),
    },
    {
      id: 3,
      type: "info",
      title: "Supply Delivery Scheduled",
      message: "Bandages arriving tomorrow",
      time: "2 hours ago",
      action: "View Details",
      onClick: () => router.push("/orders"),
    },
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "warning":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "critical":
        return {
          border: "border-l-4 border-red-500",
          bg: "bg-gradient-to-r from-red-50 to-transparent",
        }
      case "warning":
        return {
          border: "border-l-4 border-orange-500",
          bg: "bg-gradient-to-r from-orange-50 to-transparent",
        }
      case "info":
        return {
          border: "border-l-4 border-blue-500",
          bg: "bg-gradient-to-r from-blue-50 to-transparent",
        }
      default:
        return {
          border: "border-l-4 border-gray-500",
          bg: "bg-gradient-to-r from-gray-50 to-transparent",
        }
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-heading text-xl">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <span>Active Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => {
            const styles = getAlertStyles(alert.type)
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl ${styles.bg} ${styles.border} hover-lift transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground font-heading">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full bg-gradient-to-r from-primary to-accent text-white border-0 hover:from-primary/90 hover:to-accent/90 transition-all duration-200 font-medium"
                  onClick={alert.onClick}
                >
                  {alert.action}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
