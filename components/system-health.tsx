"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Users,
  Package,
  MapPin,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

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
      return {
        status: "Excellent",
        color: "text-secondary",
        bgColor: "bg-secondary/10",
        icon: CheckCircle,
        badge: "default",
        description: "System operating optimally",
      }
    } else if (healthPercentage >= 70) {
      return {
        status: "Good",
        color: "text-primary",
        bgColor: "bg-primary/10",
        icon: CheckCircle,
        badge: "secondary",
        description: "System performing well",
      }
    } else if (healthPercentage >= 50) {
      return {
        status: "Warning",
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        icon: AlertTriangle,
        badge: "secondary",
        description: "Attention required",
      }
    } else {
      return {
        status: "Critical",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        icon: XCircle,
        badge: "destructive",
        description: "Immediate action needed",
      }
    }
  }

  const health = getHealthStatus()
  const healthPercentage = Math.max(
    0,
    100 - ((stats.belowParCount + stats.expiringCount) / Math.max(stats.totalItems, 1)) * 100,
  )

  const systemMetrics = [
    {
      label: "Inventory Items",
      value: stats.totalItems,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/inventory",
    },
    {
      label: "Storage Locations",
      value: stats.locationCount,
      icon: MapPin,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      href: "/locations",
    },
    {
      label: "Active Users",
      value: stats.userCount,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      href: "/users",
    },
    {
      label: "Administrators",
      value: stats.adminCount,
      icon: Database,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      href: "/users",
    },
  ]

  const alertMetrics = [
    {
      label: "Items Below Par",
      value: stats.belowParCount,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      urgent: stats.belowParCount > 0,
    },
    {
      label: "Expiring Soon",
      value: stats.expiringCount,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      urgent: stats.expiringCount > 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* System Health Overview */}
      <Card className="border-border lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 medical-heading">
                <health.icon className={`h-5 w-5 ${health.color}`} />
                System Health Monitor
              </CardTitle>
              <CardDescription>{health.description}</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Overall Health Score</span>
              <div className="flex items-center gap-2">
                <Badge variant={health.badge as any} className="capitalize">
                  {health.status}
                </Badge>
                <span className="text-2xl font-bold text-foreground">{Math.round(healthPercentage)}%</span>
              </div>
            </div>
            <Progress value={healthPercentage} className="h-3" />
            <div className="text-xs text-muted-foreground">
              Based on inventory alerts, system performance, and operational metrics
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {alertMetrics.map((metric, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${metric.urgent ? "border-destructive/20" : "border-border"} ${metric.bgColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                  {metric.urgent && <AlertTriangle className="h-5 w-5 text-destructive" />}
                </div>
                <div className="text-sm font-medium text-foreground mb-2">{metric.label}</div>
                {metric.urgent && (
                  <Button asChild size="sm" variant="outline" className="w-full text-xs bg-transparent">
                    <Link href="/inventory">View Details</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Activity Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Recent Activity</div>
                <div className="text-xs text-muted-foreground">Last 24 hours</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{stats.recentActivityCount}</div>
              <div className="text-xs text-muted-foreground">transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 medical-heading">
            <TrendingUp className="h-5 w-5" />
            System Metrics
          </CardTitle>
          <CardDescription>Key operational statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="group">
                <Link href={metric.href} className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:shadow-sm transition-all group-hover:border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${metric.bgColor}`}>
                        <metric.icon className={`h-4 w-4 ${metric.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">Click to manage</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-foreground">{metric.value}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
