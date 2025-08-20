"use client"

import { AlertTriangle, Clock, TrendingDown, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AlertItem {
  id: string
  name: string
  current_quantity: number
  par_level: number
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
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Critical Stock Alerts
          </CardTitle>
          <CardDescription className="text-red-600">
            {belowParItems.length} items require immediate restocking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {belowParItems.length > 0 ? (
            <div className="space-y-3">
              {belowParItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Package className="h-3 w-3" />
                      {getStoragePath(item)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm mb-1">
                      <span className="font-bold text-red-600">{item.current_quantity}</span>
                      <span className="text-gray-500">
                        {" "}
                        / {item.par_level} {item.unit_of_measure}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs font-medium">
                      Need {item.par_level - item.current_quantity}
                    </Badge>
                  </div>
                </div>
              ))}
              {belowParItems.length > 5 && (
                <div className="text-center pt-3 border-t border-red-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                    asChild
                  >
                    <Link href="/inventory?filter=low">View All {belowParItems.length} Critical Items</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium text-green-700">All items are properly stocked</p>
              <p className="text-sm text-gray-600">No critical stock alerts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiring Items */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Clock className="h-5 w-5" />
            Expiration Alerts
          </CardTitle>
          <CardDescription className="text-orange-600">
            {expiringItems.length} items expiring within 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiringItems.length > 0 ? (
            <div className="space-y-3">
              {expiringItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-white border border-orange-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Package className="h-3 w-3" />
                      {getStoragePath(item)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {item.current_quantity} {item.unit_of_measure}
                    </div>
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                      {item.expiration_date && formatExpirationDate(item.expiration_date)}
                    </Badge>
                  </div>
                </div>
              ))}
              {expiringItems.length > 5 && (
                <div className="text-center pt-3 border-t border-orange-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-transparent"
                    asChild
                  >
                    <Link href="/inventory?filter=expiring">View All {expiringItems.length} Expiring Items</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium text-green-700">No expiration concerns</p>
              <p className="text-sm text-gray-600">All items have sufficient shelf life</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
