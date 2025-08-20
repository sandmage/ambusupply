import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, AlertTriangle, Clock, MapPin } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalItems: number
    belowParCount: number
    expiringCount: number
    locationCount: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      value: stats.totalItems,
      label: "Total Items",
      color: "text-primary",
      bgColor: "bg-primary/10",
      icon: TrendingUp,
    },
    {
      value: stats.belowParCount,
      label: "Below Par Level",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      icon: AlertTriangle,
    },
    {
      value: stats.expiringCount,
      label: "Expiring Soon",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      icon: Clock,
    },
    {
      value: stats.locationCount,
      label: "Storage Locations",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      icon: MapPin,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card key={index} className="apple-card group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-2xl ${item.bgColor} transition-transform duration-200 group-hover:scale-110`}
              >
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-serif font-bold ${item.color} mb-2`}>{item.value}</div>
            <div className="text-sm text-muted-foreground font-medium">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
