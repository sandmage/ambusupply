"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Minus, Plus, Package, MapPin } from "lucide-react"
import { format } from "date-fns"

interface ActivityItem {
  id: string
  transaction_type: string
  quantity_change: number
  quantity_after: number
  notes?: string
  created_at: string
  item_name: string
  location_name: string
  user_name?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "use":
        return <Minus className="h-4 w-4 text-red-600" />
      case "restock":
        return <Plus className="h-4 w-4 text-green-600" />
      case "adjustment":
        return <Package className="h-4 w-4 text-blue-600" />
      case "expired":
        return <Package className="h-4 w-4 text-orange-600" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "use":
        return (
          <Badge variant="destructive" className="text-xs">
            Used
          </Badge>
        )
      case "restock":
        return (
          <Badge variant="default" className="text-xs bg-green-600">
            Restocked
          </Badge>
        )
      case "adjustment":
        return (
          <Badge variant="secondary" className="text-xs">
            Adjusted
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="secondary" className="text-xs bg-orange-600">
            Expired
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        )
    }
  }

  const formatQuantityChange = (change: number) => {
    return change > 0 ? `+${change}` : change.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest inventory transactions ({activities.length} recent)</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="mt-1">{getActivityIcon(activity.transaction_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{activity.item_name}</span>
                    {getActivityBadge(activity.transaction_type)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {activity.location_name}
                    </div>
                  </div>
                  <div className="text-sm">
                    Quantity: <span className="font-medium">{formatQuantityChange(activity.quantity_change)}</span>
                    <span className="text-muted-foreground"> → {activity.quantity_after}</span>
                  </div>
                  {activity.notes && <div className="text-xs text-muted-foreground mt-1">{activity.notes}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(activity.created_at), "MMM dd, yyyy 'at' h:mm a")}
                    {activity.user_name && ` by ${activity.user_name}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
