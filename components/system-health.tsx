"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, Database, Users, Package, MapPin } from "lucide-react"

interface SystemHealthProps {
  stats: {
    totalItems: number
    belowParCount: number
    expiringCount: number
    locationCount: number
    userCount: number
    adminCount: number
    recentActivityCount: number
  }
}

export function SystemHealth({ stats }: SystemHealthProps) {
  const getHealthStatus = () => {
    const criticalIssues = stats.belowParCount + stats.expiringCount
    const healthPercentage = Math.max(0, 100 - (criticalIssues / Math.max(stats.totalItems, 1)) * 100)

    if (healthPercentage >= 90) {
      return { status: "excellent", color: "text-green-600", icon: CheckCircle, badge: "default" }
    } else if (healthPercentage >= 70) {
      return { status: "good", color: "text-blue-600", icon: CheckCircle, badge: "secondary" }
    } else if (healthPercentage >= 50) {
      return { status: "warning", color: "text-orange-600", icon: AlertTriangle, badge: "secondary" }
    } else {
      return { status: "critical", color: "text-red-600", icon: XCircle, badge: "destructive" }
    }
  }

  const health = getHealthStatus()
  const healthPercentage = Math.max(
    0,
    100 - ((stats.belowParCount + stats.expiringCount) / Math.max(stats.totalItems, 1)) * 100,
  )

  const systemMetrics = [
    {
      label: "Total Inventory Items",
      value: stats.totalItems,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Storage Locations",
      value: stats.locationCount,
      icon: MapPin,
      color: "text-green-600",
    },
    {
      label: "Active Users",
      value: stats.userCount,
      icon: Users,
      color: "text-purple-600",
    },
    {
      label: "System Administrators",
      value: stats.adminCount,
      icon: Database,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <health.icon className={`h-5 w-5 ${health.color}`} />
            System Health
          </CardTitle>
          <CardDescription>Overall system status and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <Badge variant={health.badge as any} className="capitalize">
                {health.status}
              </Badge>
            </div>
            <Progress value={healthPercentage} className="h-2" />
            <div className="text-sm text-muted-foreground">
              {Math.round(healthPercentage)}% - Based on inventory alerts and system status
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.belowParCount}</div>
                <div className="text-xs text-muted-foreground">Below Par</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.expiringCount}</div>
                <div className="text-xs text-muted-foreground">Expiring Soon</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Metrics
          </CardTitle>
          <CardDescription>Key system statistics and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="text-lg font-bold">{metric.value}</div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Recent Activity (24h)</span>
                <span className="font-medium">{stats.recentActivityCount} transactions</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
