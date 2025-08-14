import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, AlertTriangle, CheckCircle } from "lucide-react"

export function DashboardStats() {
  const stats = [
    {
      title: "Active Ambulances",
      value: "24",
      change: "+2 from yesterday",
      icon: Truck,
      color: "text-primary",
      bgGradient: "from-primary/10 to-primary/5",
    },
    {
      title: "Supply Items",
      value: "1,247",
      change: "+15 new items",
      icon: Package,
      color: "text-emerald-600",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      title: "Low Stock Alerts",
      value: "8",
      change: "3 critical",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgGradient: "from-orange-500/10 to-orange-500/5",
    },
    {
      title: "Completed Orders",
      value: "156",
      change: "+12 today",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="hover-lift border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm touch-target active:scale-95 transition-all duration-200"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground font-heading leading-tight">
              {stat.title}
            </CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex-shrink-0`}>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-3xl font-bold text-foreground font-heading mb-1 sm:mb-2">{stat.value}</div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
