"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, DollarSign, Clock, AlertTriangle, CheckCircle, Plus, Search, Filter } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function FleetMaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const maintenanceRecords = [
    {
      id: "MAINT-001",
      vehicleId: "AMB-001",
      type: "Oil Change",
      category: "routine",
      date: "2024-01-10",
      nextDue: "2024-04-10",
      mileage: 45230,
      nextMileage: 48230,
      cost: 85.5,
      serviceProvider: "Fleet Services Inc",
      technician: "Mike Johnson",
      status: "completed",
      notes: "Standard oil change with filter replacement",
      daysUntilNext: 85,
    },
    {
      id: "MAINT-002",
      vehicleId: "AMB-007",
      type: "Brake Inspection",
      category: "safety",
      date: "2024-01-08",
      nextDue: "2024-07-08",
      mileage: 32150,
      nextMileage: 35150,
      cost: 150.0,
      serviceProvider: "Safety First Auto",
      technician: "Sarah Wilson",
      status: "completed",
      notes: "Brake pads at 40%, recommend replacement in 6 months",
      daysUntilNext: 154,
    },
    {
      id: "MAINT-003",
      vehicleId: "AMB-012",
      type: "Transmission Service",
      category: "major",
      date: "2024-01-12",
      nextDue: "2025-01-12",
      mileage: 38920,
      nextMileage: 48920,
      cost: 450.0,
      serviceProvider: "Advanced Auto Care",
      technician: "Robert Chen",
      status: "completed",
      notes: "Full transmission fluid change and filter replacement",
      daysUntilNext: 347,
    },
    {
      id: "MAINT-004",
      vehicleId: "AMB-015",
      type: "Engine Repair",
      category: "repair",
      date: "2024-01-15",
      nextDue: null,
      mileage: 52780,
      nextMileage: null,
      cost: 1250.0,
      serviceProvider: "Emergency Vehicle Specialists",
      technician: "David Martinez",
      status: "in-progress",
      notes: "Replacing faulty alternator and checking electrical system",
      daysUntilNext: null,
    },
    {
      id: "MAINT-005",
      vehicleId: "AMB-007",
      type: "Oil Change",
      category: "routine",
      date: null,
      nextDue: "2024-03-20",
      mileage: null,
      nextMileage: 35150,
      cost: null,
      serviceProvider: "Fleet Services Inc",
      technician: null,
      status: "scheduled",
      notes: "Scheduled oil change - overdue",
      daysUntilNext: -5,
    },
  ]

  const vehicles = [
    { id: "AMB-001", type: "Advanced Life Support", mileage: 45230 },
    { id: "AMB-007", type: "Basic Life Support", mileage: 32150 },
    { id: "AMB-012", type: "Critical Care", mileage: 38920 },
    { id: "AMB-015", type: "Advanced Life Support", mileage: 52780 },
  ]

  const getStatusBadge = (status: string, daysUntilNext?: number | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "scheduled":
        if (daysUntilNext !== null && daysUntilNext < 0) {
          return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
        }
        return <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "routine":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Routine
          </Badge>
        )
      case "safety":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            Safety
          </Badge>
        )
      case "major":
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            Major
          </Badge>
        )
      case "repair":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Repair
          </Badge>
        )
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  const getStatusColor = (status: string, daysUntilNext?: number | null) => {
    if (status === "scheduled" && daysUntilNext !== null && daysUntilNext < 0) return "text-red-600"
    if (status === "scheduled" && daysUntilNext !== null && daysUntilNext <= 7) return "text-yellow-600"
    return ""
  }

  const handleAddMaintenance = () => {
    toast.info("Add Maintenance", {
      description: "Maintenance record form will open here. Feature in development.",
    })
  }

  const handleEditMaintenance = (maintenanceId: string) => {
    toast.info(`Edit ${maintenanceId}`, {
      description: "Maintenance edit form will open here. Feature in development.",
    })
  }

  const handleScheduleMaintenance = (vehicleId: string) => {
    toast.info(`Schedule Maintenance`, {
      description: `Scheduling maintenance for ${vehicleId}. Feature in development.`,
    })
  }

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch =
      record.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serviceProvider.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || record.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getUpcomingMaintenance = () => {
    return maintenanceRecords
      .filter((record) => record.status === "scheduled" && record.daysUntilNext !== null && record.daysUntilNext <= 30)
      .sort((a, b) => (a.daysUntilNext || 0) - (b.daysUntilNext || 0))
  }

  const getTotalMaintenanceCost = (period: string) => {
    const now = new Date()
    const startDate = new Date()

    if (period === "month") {
      startDate.setMonth(now.getMonth() - 1)
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    return maintenanceRecords
      .filter((record) => record.cost && new Date(record.date || "") >= startDate)
      .reduce((total, record) => total + (record.cost || 0), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Maintenance Records</h1>
          <p className="text-muted-foreground mt-1">Track maintenance schedules, repairs, and service history</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAddMaintenance}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${getTotalMaintenanceCost("month").toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{getUpcomingMaintenance().length}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {maintenanceRecords.filter((r) => r.status === "in-progress").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active repairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {maintenanceRecords.filter((r) => r.daysUntilNext !== null && r.daysUntilNext < 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search maintenance records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Upcoming Maintenance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getUpcomingMaintenance()
                .slice(0, 3)
                .map((record) => (
                  <div key={record.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{record.vehicleId}</span>
                      <div className="text-muted-foreground">{record.type}</div>
                    </div>
                    <span
                      className={`${record.daysUntilNext && record.daysUntilNext < 0 ? "text-red-600" : record.daysUntilNext && record.daysUntilNext <= 7 ? "text-red-600" : "text-yellow-600"}`}
                    >
                      {record.daysUntilNext && record.daysUntilNext < 0
                        ? `${Math.abs(record.daysUntilNext)} days overdue`
                        : `${record.daysUntilNext} days`}
                    </span>
                  </div>
                ))}
              {getUpcomingMaintenance().length === 0 && (
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>All maintenance current</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Records</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="by-vehicle">By Vehicle</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="font-semibold text-foreground">{record.id}</div>
                    <Badge variant="outline">{record.vehicleId}</Badge>
                    {getStatusBadge(record.status, record.daysUntilNext)}
                    {getCategoryBadge(record.category)}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEditMaintenance(record.id)}>
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Service Type:</span>
                    <div className="font-medium">{record.type}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Date:</span>
                    <div className="font-medium">{record.date || "Not scheduled"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Cost:</span>
                    <div className="font-medium">{record.cost ? `$${record.cost.toFixed(2)}` : "TBD"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Service Provider:</span>
                    <div className="font-medium">{record.serviceProvider}</div>
                  </div>
                </div>

                {record.nextDue && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Next Due:</span>
                      <div className={`font-medium ${getStatusColor(record.status, record.daysUntilNext)}`}>
                        {record.nextDue}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Next Mileage:</span>
                      <div className="font-medium">
                        {record.nextMileage ? `${record.nextMileage.toLocaleString()} mi` : "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground text-sm">Notes:</span>
                    <div className="text-sm mt-1">{record.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="space-y-4">
            {filteredRecords
              .filter((r) => r.status === "scheduled")
              .map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-foreground">{record.vehicleId}</div>
                        <div className="text-lg">{record.type}</div>
                        {getStatusBadge(record.status, record.daysUntilNext)}
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getStatusColor(record.status, record.daysUntilNext)}`}>
                          {record.daysUntilNext && record.daysUntilNext < 0
                            ? `${Math.abs(record.daysUntilNext)} days overdue`
                            : `${record.daysUntilNext} days remaining`}
                        </div>
                        <div className="text-sm text-muted-foreground">Due: {record.nextDue}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Service Provider: {record.serviceProvider}</div>
                      <Button variant="outline" size="sm" onClick={() => handleEditMaintenance(record.id)}>
                        Reschedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {filteredRecords
              .filter((r) => r.status === "completed")
              .map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-foreground">{record.vehicleId}</div>
                        <div className="text-lg">{record.type}</div>
                        {getCategoryBadge(record.category)}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${record.cost?.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{record.date}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Technician:</span>
                        <span className="font-medium ml-2">{record.technician}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mileage:</span>
                        <span className="font-medium ml-2">{record.mileage?.toLocaleString()} mi</span>
                      </div>
                    </div>
                    {record.notes && <div className="mt-3 p-3 bg-muted rounded-lg text-sm">{record.notes}</div>}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="by-vehicle">
          <div className="space-y-6">
            {vehicles.map((vehicle) => {
              const vehicleRecords = filteredRecords.filter((r) => r.vehicleId === vehicle.id)
              return (
                <Card key={vehicle.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span>{vehicle.id}</span>
                        <Badge variant="outline">{vehicle.type}</Badge>
                        <span className="text-sm text-muted-foreground">{vehicle.mileage.toLocaleString()} mi</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleScheduleMaintenance(vehicle.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vehicleRecords.length > 0 ? (
                        vehicleRecords.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="font-medium">{record.type}</div>
                              {getStatusBadge(record.status, record.daysUntilNext)}
                              {getCategoryBadge(record.category)}
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">{record.date || record.nextDue}</div>
                              <div className="text-muted-foreground">
                                {record.cost ? `$${record.cost.toFixed(2)}` : "TBD"}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">No maintenance records found</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
