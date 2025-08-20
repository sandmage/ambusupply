"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, AlertTriangle, Package, MapPin } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  location_name: string
  expiration_date?: string
}

interface InventoryReportsProps {
  items: InventoryItem[]
}

export function InventoryReports({ items }: InventoryReportsProps) {
  const analytics = useMemo(() => {
    const totalValue = items.length
    const lowStockItems = items.filter((item) => item.quantity < item.min_par_level && item.min_par_level > 0)
    const outOfStockItems = items.filter((item) => item.quantity === 0)
    const expiringItems = items.filter((item) => {
      if (!item.expiration_date) return false
      const expirationDate = new Date(item.expiration_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return expirationDate <= thirtyDaysFromNow
    })

    // Location analysis
    const locationStats = items.reduce(
      (acc, item) => {
        if (!acc[item.location_name]) {
          acc[item.location_name] = { total: 0, lowStock: 0, outOfStock: 0 }
        }
        acc[item.location_name].total++
        if (item.quantity < item.min_par_level && item.min_par_level > 0) {
          acc[item.location_name].lowStock++
        }
        if (item.quantity === 0) {
          acc[item.location_name].outOfStock++
        }
        return acc
      },
      {} as Record<string, { total: number; lowStock: number; outOfStock: number }>,
    )

    // Top items by usage risk
    const riskItems = items
      .map((item) => ({
        ...item,
        riskScore: item.min_par_level > 0 ? (item.min_par_level - item.quantity) / item.min_par_level : 0,
      }))
      .filter((item) => item.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10)

    return {
      totalValue,
      lowStockItems,
      outOfStockItems,
      expiringItems,
      locationStats,
      riskItems,
    }
  }, [items])

  return (
    <div className="space-y-8">
      <Card className="apple-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-serif font-bold text-primary">
            <div className="p-2 rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6" />
            </div>
            Inventory Analytics
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Comprehensive analysis of your medical supply inventory
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Analysis */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-serif font-bold">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              High Risk Items
            </CardTitle>
            <CardDescription>Items most likely to run out soon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.riskItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20">
                <div className="flex-1">
                  <div className="font-semibold text-foreground">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.location_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} / {item.min_par_level} {item.unit_of_measure}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="mb-2">
                    {Math.round(item.riskScore * 100)}% Risk
                  </Badge>
                  <Progress value={Math.max(0, (item.quantity / item.min_par_level) * 100)} className="w-24 h-2" />
                </div>
              </div>
            ))}
            {analytics.riskItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">All items are well stocked!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Analysis */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-serif font-bold">
              <MapPin className="h-5 w-5 text-primary" />
              Location Analysis
            </CardTitle>
            <CardDescription>Inventory distribution by location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.locationStats).map(([location, stats]) => (
              <div key={location} className="p-4 rounded-2xl bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-foreground">{location}</div>
                  <Badge variant="outline">{stats.total} items</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Low Stock:</span>
                    <span className={stats.lowStock > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {stats.lowStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Out of Stock:</span>
                    <span className={stats.outOfStock > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {stats.outOfStock}
                    </span>
                  </div>
                </div>
                <Progress
                  value={Math.max(0, ((stats.total - stats.lowStock - stats.outOfStock) / stats.total) * 100)}
                  className="mt-3 h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Expiring Items */}
      {analytics.expiringItems.length > 0 && (
        <Card className="apple-card border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-serif font-bold text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Expiring Items Alert
            </CardTitle>
            <CardDescription>Items expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.expiringItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/60 border border-orange-200">
                  <div className="font-semibold text-foreground mb-1">{item.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">{item.location_name}</div>
                  <div className="text-sm text-orange-700 font-medium">
                    Expires: {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} {item.unit_of_measure}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
