import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, DollarSign, Clock, AlertTriangle } from "lucide-react"

export function ReportsOverview() {
  const kpis = [
    {
      title: "Response Time",
      value: "8.2 min",
      change: "-12%",
      trend: "down",
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "Fleet Utilization",
      value: "78%",
      change: "+5%",
      trend: "up",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      title: "Monthly Costs",
      value: "$45,230",
      change: "-8%",
      trend: "down",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Critical Alerts",
      value: "3",
      change: "+2",
      trend: "up",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="flex items-center space-x-1 mt-1">
              {kpi.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>{kpi.change}</span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
