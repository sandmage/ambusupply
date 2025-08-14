import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react"

export function InventoryStats() {
  const stats = [
    {
      title: "Total Items",
      value: "1,247",
      change: "+23 this week",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Low Stock Items",
      value: "18",
      change: "3 critical",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Inventory Value",
      value: "$284,590",
      change: "+5.2% from last month",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Usage Rate",
      value: "87%",
      change: "+2.1% efficiency",
      icon: TrendingUp,
      color: "text-primary",
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
