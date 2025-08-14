import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Wrench, FileText, ClipboardCheck } from "lucide-react"

export function FleetStats() {
  const stats = [
    {
      title: "Total Vehicles",
      value: "24",
      change: "2 new this month",
      icon: Truck,
      color: "text-blue-600",
    },
    {
      title: "In Service",
      value: "18",
      change: "75% operational",
      icon: ClipboardCheck,
      color: "text-green-600",
    },
    {
      title: "Maintenance Due",
      value: "5",
      change: "2 overdue",
      icon: Wrench,
      color: "text-orange-600",
    },
    {
      title: "Documents Expiring",
      value: "3",
      change: "Within 30 days",
      icon: FileText,
      color: "text-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
