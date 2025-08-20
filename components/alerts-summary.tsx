"use client"

import { AlertTriangle, Clock, TrendingDown, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AlertItem {
  id: string
  name: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  expiration_date?: string
  location_name: string
  storage_unit_name?: string
}

interface AlertsSummaryProps {
  belowParItems: AlertItem[]
  expiringItems: AlertItem[]
}

export function AlertsSummary({ belowParItems, expiringItems }: AlertsSummaryProps) {
  const getStoragePath = (item: AlertItem) => {
    return item.storage_unit_name ? `${item.location_name} > ${item.storage_unit_name}` : item.location_name
  }

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Expired ${Math.abs(diffDays)} days ago`
    } else if (diffDays === 0) {
      return "Expires today"
    } else if (diffDays === 1) {
      return "Expires tomorrow"
    } else {
      return `Expires in ${diffDays} days`
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Below Par Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Items Below Par Level
          </CardTitle>
          <CardDescription>Items that need restocking ({belowParItems.length} items)</CardDescription>
        </CardHeader>
        <CardContent>
          {belowParItems.length > 0 ? (
            <div className="space-y-3">
              {belowParItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {getStoragePath(item)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="font-medium text-red-600">{item.quantity}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {item.min_par_level} {item.unit_of_measure}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Need {item.min_par_level - item.quantity}
                    </Badge>
                  </div>
                </div>
              ))}
              {belowParItems.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/inventory?filter=low">View All {belowParItems.length} Items</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-8 w-8 mx-auto mb-2" />
              <p>All items are at or above par level</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiring Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Expiring Items
          </CardTitle>
          <CardDescription>Items expiring within 30 days ({expiringItems.length} items)</CardDescription>
        </CardHeader>
        <CardContent>
          {expiringItems.length > 0 ? (
            <div className="space-y-3">
              {expiringItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {getStoragePath(item)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {item.quantity} {item.unit_of_measure}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.expiration_date && formatExpirationDate(item.expiration_date)}
                    </Badge>
                  </div>
                </div>
              ))}
              {expiringItems.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/inventory?filter=expiring">View All {expiringItems.length} Items</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No items expiring in the next 30 days</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
