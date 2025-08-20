import { Card, CardContent } from "@/components/ui/card"

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
    { value: stats.totalItems, label: "Total Items", color: "text-primary" },
    { value: stats.belowParCount, label: "Below Par Level", color: "text-destructive" },
    { value: stats.expiringCount, label: "Expiring Soon", color: "text-destructive" },
    { value: stats.locationCount, label: "Storage Locations", color: "text-secondary" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index} className="border-border">
          <CardContent className="p-6">
            <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-sm text-muted-foreground font-medium">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
