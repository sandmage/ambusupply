"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Wrench, Calendar, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

export function MaintenanceOverview() {
  const router = useRouter()

  const maintenanceData = {
    totalVehicles: 24,
    upToDate: 18,
    dueThisWeek: 3,
    overdue: 2,
    inProgress: 1,
    monthlyBudget: 15000,
    monthlySpent: 8750,
    avgCostPerVehicle: 365,
  }

  const upcomingMaintenance = [
    {
      vehicleId: "AMB-007",
      type: "Oil Change",
      dueDate: "2024-03-20",
      daysOverdue: 5,
      priority: "high",
    },
    {
      vehicleId: "AMB-003",
      type: "Brake Inspection",
      dueDate: "2024-03-25",
      daysUntil: 3,
      priority: "medium",
    },
    {
      vehicleId: "AMB-012",
      type: "Transmission Service",
      dueDate: "2024-03-28",
      daysUntil: 6,
      priority: "low",
    },
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleViewMaintenance = () => {
    router.push("/fleet/maintenance")
  }

  const budgetPercentage = (maintenanceData.monthlySpent / maintenanceData.monthlyBudget) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>Maintenance Overview</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewMaintenance}>
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Maintenance Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{maintenanceData.upToDate}</div>
            <div className="text-sm text-muted-foreground">Up to Date</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{maintenanceData.dueThisWeek}</div>
            <div className="text-sm text-muted-foreground">Due This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{maintenanceData.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{maintenanceData.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
        </div>

        {/* Budget Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Monthly Budget</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ${maintenanceData.monthlySpent.toLocaleString()} / ${maintenanceData.monthlyBudget.toLocaleString()}
            </span>
          </div>
          <Progress value={budgetPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {budgetPercentage.toFixed(1)}% of monthly budget used • Avg: ${maintenanceData.avgCostPerVehicle}/vehicle
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Upcoming Maintenance</span>
          </div>
          <div className="space-y-2">
            {upcomingMaintenance.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="font-medium">{item.vehicleId}</div>
                  <div className="text-sm text-muted-foreground">{item.type}</div>
                  {getPriorityBadge(item.priority)}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {item.daysOverdue ? (
                      <span className="text-red-600">{item.daysOverdue} days overdue</span>
                    ) : (
                      <span className="text-muted-foreground">in {item.daysUntil} days</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
