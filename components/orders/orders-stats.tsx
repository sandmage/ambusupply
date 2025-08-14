import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Clock, CheckCircle, DollarSign } from "lucide-react"

export function OrdersStats() {
  const stats = [
    {
      title: "Total Orders",
      value: "156",
      change: "+12 this month",
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Pending Orders",
      value: "8",
      change: "2 urgent",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Completed Orders",
      value: "148",
      change: "95% success rate",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Monthly Spend",
      value: "$45,230",
      change: "-8% from last month",
      icon: DollarSign,
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
