"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Wrench, AlertTriangle, CheckCircle } from "lucide-react"

interface MaintenanceRecord {
  id: string
  vehicle_id: string
  maintenance_type: string
  description: string
  scheduled_date: string
  completed_date?: string
  vehicle?: {
    vehicle_number: string
    make: string
    model: string
  }
}

interface MaintenanceCalendarProps {
  onSelectMaintenance?: (maintenance: MaintenanceRecord) => void
}

export function MaintenanceCalendar({ onSelectMaintenance }: MaintenanceCalendarProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"month" | "week">("month")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchMaintenanceRecords()
  }, [currentDate])

  const fetchMaintenanceRecords = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const { data } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicle:vehicles(vehicle_number, make, model)
        `)
        .gte("scheduled_date", startOfMonth.toISOString().split("T")[0])
        .lte("scheduled_date", endOfMonth.toISOString().split("T")[0])
        .order("scheduled_date")

      setMaintenanceRecords(data || [])
    } catch (error) {
      console.error("Error fetching maintenance records:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getMaintenanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return maintenanceRecords.filter((record) => record.scheduled_date === dateStr)
  }

  const getMaintenanceStatusIcon = (record: MaintenanceRecord) => {
    if (record.completed_date) {
      return <CheckCircle className="h-3 w-3 text-secondary" />
    }

    const scheduledDate = new Date(record.scheduled_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (scheduledDate < today) {
      return <AlertTriangle className="h-3 w-3 text-destructive" />
    }

    return <Wrench className="h-3 w-3 text-accent" />
  }

  const getMaintenanceStatusBadge = (record: MaintenanceRecord) => {
    if (record.completed_date) {
      return (
        <Badge variant="secondary" className="text-xs rounded-lg">
          Completed
        </Badge>
      )
    }

    const scheduledDate = new Date(record.scheduled_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (scheduledDate < today) {
      return (
        <Badge variant="destructive" className="text-xs rounded-lg">
          Overdue
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="text-xs rounded-lg">
        Scheduled
      </Badge>
    )
  }

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDateObj = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const dayMaintenance = getMaintenanceForDate(currentDateObj)
      const isCurrentMonth = currentDateObj.getMonth() === month
      const isToday = currentDateObj.toDateString() === new Date().toDateString()

      days.push(
        <div
          key={currentDateObj.toISOString()}
          className={`min-h-[120px] p-2 border border-border/20 ${
            isCurrentMonth ? "bg-card" : "bg-muted/30"
          } ${isToday ? "ring-2 ring-primary/30" : ""}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
              {currentDateObj.getDate()}
            </span>
            {dayMaintenance.length > 0 && (
              <Badge variant="outline" className="text-xs rounded-lg">
                {dayMaintenance.length}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {dayMaintenance.slice(0, 3).map((record) => (
              <div
                key={record.id}
                onClick={() => onSelectMaintenance?.(record)}
                className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-1">
                  {getMaintenanceStatusIcon(record)}
                  <span className="text-xs font-medium truncate">{record.vehicle?.vehicle_number}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{record.description}</p>
              </div>
            ))}
            {dayMaintenance.length > 3 && (
              <p className="text-xs text-muted-foreground">+{dayMaintenance.length - 3} more</p>
            )}
          </div>
        </div>,
      )

      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card className="apple-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Maintenance Calendar</CardTitle>
              <CardDescription>View and manage scheduled maintenance</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={viewMode} onValueChange={(value: "month" | "week") => setViewMode(value)}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-serif font-semibold">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-border/20 rounded-xl overflow-hidden">
          {renderCalendarGrid()}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 p-4 bg-muted/30 rounded-xl">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-secondary" />
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wrench className="h-4 w-4 text-accent" />
            <span className="text-sm">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
