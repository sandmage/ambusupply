"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ExternalLink, Package } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  ordering_url?: string
  location_name: string
  storage_unit_name?: string
}

interface LowStockReorderProps {
  items: InventoryItem[]
  userRole: string
}

export function LowStockReorder({ items, userRole }: LowStockReorderProps) {
  const isAdmin = userRole === "admin"

  // Filter items that are low stock or out of stock
  const lowStockItems = items.filter((item) => item.quantity <= item.min_par_level && item.min_par_level > 0)

  const outOfStockItems = lowStockItems.filter((item) => item.quantity === 0)
  const belowParItems = lowStockItems.filter((item) => item.quantity > 0)

  if (lowStockItems.length === 0) {
    return (
      <Card className="apple-card border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-100">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-green-800">All Items Well Stocked</h3>
              <p className="text-sm text-green-600">No items require immediate reordering</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleReorder = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Card className="apple-card border-destructive/30 bg-gradient-to-r from-destructive/5 to-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-destructive">
          <div className="p-2 rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <span className="font-serif font-bold">Items Requiring Reorder</span>
        </CardTitle>
        <CardDescription className="text-base">
          {lowStockItems.length} items need attention • {outOfStockItems.length} out of stock • {belowParItems.length}{" "}
          below par level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Out of Stock Items */}
        {outOfStockItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Out of Stock ({outOfStockItems.length})
            </h4>
            <div className="grid gap-3">
              {outOfStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-white/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-semibold text-gray-900">{item.name}</h5>
                      <Badge variant="destructive" className="text-xs">
                        OUT OF STOCK
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Location:</span> {item.location_name}
                      {item.storage_unit_name && <span> • {item.storage_unit_name}</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Par Level:</span> {item.min_par_level} {item.unit_of_measure}
                    </div>
                  </div>
                  {isAdmin && item.ordering_url && (
                    <Button
                      onClick={() => handleReorder(item.ordering_url!)}
                      className="apple-button-secondary ml-4"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Below Par Level Items */}
        {belowParItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Below Par Level ({belowParItems.length})
            </h4>
            <div className="grid gap-3">
              {belowParItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-orange-200 bg-white/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-semibold text-gray-900">{item.name}</h5>
                      <Badge className="text-xs bg-orange-500 text-white hover:bg-orange-600">LOW STOCK</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Current:</span> {item.quantity} {item.unit_of_measure} •
                      <span className="font-medium"> Par Level:</span> {item.min_par_level} {item.unit_of_measure}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Location:</span> {item.location_name}
                      {item.storage_unit_name && <span> • {item.storage_unit_name}</span>}
                    </div>
                  </div>
                  {isAdmin && item.ordering_url && (
                    <Button
                      onClick={() => handleReorder(item.ordering_url!)}
                      className="apple-button-secondary ml-4"
                      size="sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items without ordering URLs */}
        {isAdmin && lowStockItems.some((item) => !item.ordering_url) && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Some items don't have ordering links configured. Edit items to add supplier URLs
              for quick reordering.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
