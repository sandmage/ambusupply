"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Minus, Plus, Package, MapPin, Clock, User, ChevronDown, ChevronUp } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  transaction_type: string
  quantity_change: number
  quantity_after?: number
  notes?: string
  created_at: string
  item_name?: string
  location_name?: string
  user_name?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const [showAll, setShowAll] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "use":
        return <Minus className="h-4 w-4 text-destructive" />
      case "restock":
        return <Plus className="h-4 w-4 text-secondary" />
      case "adjustment":
        return <Package className="h-4 w-4 text-primary" />
      case "expired":
        return <Package className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
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
        return <Badge className="text-xs bg-secondary text-secondary-foreground">Restocked</Badge>
      case "adjustment":
        return <Badge className="text-xs bg-primary text-primary-foreground">Adjusted</Badge>
      case "expired":
        return <Badge className="text-xs bg-orange-500 text-white">Expired</Badge>
      default:
        return (
          <Badge variant="outline" className="text-xs capitalize">
            {type}
          </Badge>
        )
    }
  }

  const formatQuantityChange = (change: number) => {
    return change > 0 ? `+${change}` : change.toString()
  }

  const filteredActivities = selectedType
    ? activities.filter((activity) => activity.transaction_type === selectedType)
    : activities

  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 5)

  const activityTypes = [...new Set(activities.map((a) => a.transaction_type))]
  const typecounts = activityTypes.reduce(
    (acc, type) => {
      acc[type] = activities.filter((a) => a.transaction_type === type).length
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 medical-heading">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest inventory transactions • {activities.length} total activities</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {displayedActivities.length} shown
          </Badge>
        </div>

        {activityTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-4">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="h-8 text-xs"
            >
              All ({activities.length})
            </Button>
            {activityTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="h-8 text-xs capitalize"
              >
                {type} ({typecounts[type]})
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayedActivities.length > 0 ? (
          <div className="space-y-3">
            {displayedActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="mt-1 p-2 bg-muted rounded-full">{getActivityIcon(activity.transaction_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-foreground truncate">{activity.item_name || "Unknown Item"}</span>
                    {getActivityBadge(activity.transaction_type)}
                  </div>

                  {activity.location_name && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.location_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {formatQuantityChange(activity.quantity_change)}
                      </span>
                      {activity.quantity_after !== undefined && (
                        <span className="text-muted-foreground">→ {activity.quantity_after}</span>
                      )}
                    </div>

                    {activity.user_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{activity.user_name}</span>
                      </div>
                    )}
                  </div>

                  {activity.notes && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2">{activity.notes}</div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span title={format(new Date(activity.created_at), "MMM dd, yyyy 'at' h:mm a")}>
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredActivities.length > 5 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} className="text-xs">
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show All ({filteredActivities.length - 5} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No recent activity</p>
            <p className="text-sm">Inventory transactions will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
