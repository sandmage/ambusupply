"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, TrendingUp, Clock, AlertTriangle, ChevronRight } from "lucide-react"
import { useState } from "react"

export function MobileQuickStats() {
  const quickStats = [
    { label: "Active", value: "24", color: "text-green-600", bg: "bg-green-50" },
    { label: "Alerts", value: "8", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Orders", value: "156", color: "text-blue-600", bg: "bg-blue-50" },
  ]

  return (
    <div className="flex space-x-3 overflow-x-auto pb-2 mobile-scroll">
      {quickStats.map((stat, index) => (
        <div
          key={index}
          className={`flex-shrink-0 ${stat.bg} rounded-xl p-4 min-w-[100px] text-center touch-target active:scale-95 transition-transform`}
        >
          <div className={`text-2xl font-bold ${stat.color} font-heading`}>{stat.value}</div>
          <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export function MobileAlertCard() {
  const alerts = [
    {
      id: 1,
      title: "Low Stock Alert",
      message: "Oxygen tanks below threshold",
      priority: "high",
      time: "5 min ago",
      icon: AlertTriangle,
    },
    {
      id: 2,
      title: "Maintenance Due",
      message: "Unit 7 scheduled maintenance",
      priority: "medium",
      time: "1 hour ago",
      icon: Clock,
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="flex items-center justify-between font-heading text-lg">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Alerts</span>
          </div>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 active:bg-muted/70 transition-colors cursor-pointer touch-target"
            >
              <div className="flex-shrink-0">
                <alert.icon className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                  <Badge variant="secondary" className={`text-xs ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MobilePerformanceCard() {
  const [selectedMetric, setSelectedMetric] = useState("response")

  const metrics = {
    response: { value: "4.2", unit: "min", trend: "+0.3", label: "Avg Response Time" },
    efficiency: { value: "94", unit: "%", trend: "+2", label: "Fleet Efficiency" },
    satisfaction: { value: "4.8", unit: "/5", trend: "+0.1", label: "Service Rating" },
  }

  const currentMetric = metrics[selectedMetric as keyof typeof metrics]

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="flex items-center space-x-2 font-heading text-lg">
          <TrendingUp className="h-5 w-5" />
          <span>Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-foreground font-heading">
            {currentMetric.value}
            <span className="text-lg text-muted-foreground ml-1">{currentMetric.unit}</span>
          </div>
          <p className="text-sm text-muted-foreground">{currentMetric.label}</p>
          <div className="flex items-center justify-center space-x-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">{currentMetric.trend}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {Object.entries(metrics).map(([key, metric]) => (
            <Button
              key={key}
              variant={selectedMetric === key ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs touch-target active:scale-95 transition-transform"
              onClick={() => setSelectedMetric(key)}
            >
              {metric.label.split(" ")[0]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
