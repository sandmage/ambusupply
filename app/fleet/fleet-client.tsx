"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Car,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  BarChart3,
  Package,
} from "lucide-react"
import { VehicleForm } from "@/components/vehicle-form"
import { VehicleDetail } from "@/components/vehicle-detail"
import { MaintenanceForm } from "@/components/maintenance-form"
import { MaintenanceCalendar } from "@/components/maintenance-calendar"
import { FleetAnalytics } from "@/components/fleet-analytics"
import { VehicleInventoryManager } from "@/components/vehicle-inventory-manager"
import { VehicleParLevelManager } from "@/components/vehicle-par-level-manager"
import { VehicleInventoryTracker } from "@/components/vehicle-inventory-tracker"
import { ComplianceMonitoringDashboard } from "@/components/compliance-monitoring-dashboard"
import { DailyCheckSubmission } from "@/components/daily-check-submission"
import { DailyCheckFormBuilder } from "@/components/daily-check-form-builder"
import { DailyCheckAdminDashboard } from "@/components/daily-check-admin-dashboard"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
  vin: string
  license_plate: string
  vehicle_type: string
  status: string
  mileage: number
  fuel_capacity: number
  current_location?: any
  registration_expiration?: string
  insurance_expiration?: string
  insurance_provider?: string
  insurance_policy_number?: string
  dot_inspection_date?: string
  dot_inspection_expiration?: string
  dot_number?: string
  oems_inspection_date?: string
  oems_inspection_expiration?: string
  oems_certification_number?: string
  annual_inspection_date?: string
  annual_inspection_expiration?: string
  emissions_test_date?: string
  emissions_test_expiration?: string
  medical_equipment_certification?: string
  medical_equipment_cert_expiration?: string
  radio_license_expiration?: string
  narcotics_license_expiration?: string
}

interface MaintenanceRecord {
  id: string
  vehicle_id: string
  maintenance_type: string
  description: string
  scheduled_date: string
  completed_date?: string
  vehicle?: Vehicle
}

export function FleetClient() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [showVehicleDetail, setShowVehicleDetail] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchFleetData()
  }, [])

  const fetchFleetData = async () => {
    try {
      // Fetch vehicles
      const { data: vehiclesData } = await supabase.from("vehicles").select("*").order("vehicle_number")

      // Fetch maintenance records
      const { data: maintenanceData } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicle:vehicles(vehicle_number, make, model)
        `)
        .order("scheduled_date", { ascending: false })
        .limit(10)

      setVehicles(vehiclesData || [])
      setMaintenanceRecords(maintenanceData || [])
    } catch (error) {
      console.error("Error fetching fleet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleSave = () => {
    setShowVehicleForm(false)
    setSelectedVehicle(null)
    fetchFleetData()
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleForm(true)
  }

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowVehicleDetail(true)
  }

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", selectedVehicle.id)

      if (error) throw error

      setShowVehicleDetail(false)
      setSelectedVehicle(null)
      fetchFleetData()
    } catch (error) {
      console.error("Error deleting vehicle:", error)
    }
  }

  const handleMaintenanceSave = () => {
    setShowMaintenanceForm(false)
    setSelectedMaintenance(null)
    fetchFleetData()
  }

  const handleSelectMaintenance = (maintenance: any) => {
    setSelectedMaintenance(maintenance)
    setShowMaintenanceForm(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-secondary" />
      case "maintenance":
        return <Wrench className="h-4 w-4 text-accent" />
      case "out_of_service":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "secondary",
      maintenance: "default",
      out_of_service: "destructive",
      retired: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="rounded-lg">
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v) => v.status === "active").length,
    maintenanceVehicles: vehicles.filter((v) => v.status === "maintenance").length,
    pendingMaintenance: maintenanceRecords.filter((m) => !m.completed_date).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading fleet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Manage vehicles and maintenance schedules</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">{stats.activeVehicles} active</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceVehicles}</div>
            <p className="text-xs text-muted-foreground">vehicles servicing</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">scheduled services</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="vehicles" className="rounded-xl">
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-xl">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-xl">
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold">Vehicle Fleet</h2>
              <p className="text-muted-foreground">Manage your vehicle inventory</p>
            </div>
            <Button onClick={() => setShowVehicleForm(true)} className="apple-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-2xl">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vehicles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="apple-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{vehicle.vehicle_number}</CardTitle>
                    {getStatusIcon(vehicle.status)}
                  </div>
                  <CardDescription>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(vehicle.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mileage</span>
                    <span className="text-sm font-medium">{vehicle.mileage?.toLocaleString() || 0} mi</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl bg-transparent"
                      onClick={() => handleViewVehicle(vehicle)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl bg-transparent"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-serif font-bold">Vehicle Inventory Management</h2>
              <p className="text-muted-foreground">
                Manage inventory assignments and storage locations within vehicles
              </p>
            </div>
          </div>

          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 rounded-2xl">
              <TabsTrigger value="inventory" className="rounded-xl">
                Inventory Management
              </TabsTrigger>
              <TabsTrigger value="par-levels" className="rounded-xl">
                Par Level Management
              </TabsTrigger>
              <TabsTrigger value="tracking" className="rounded-xl">
                Tracking & Transactions
              </TabsTrigger>
              <TabsTrigger value="compliance" className="rounded-xl">
                Compliance & Restocking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <VehicleInventoryManager vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="par-levels">
              <VehicleParLevelManager vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="tracking">
              <VehicleInventoryTracker vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceMonitoringDashboard />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold">Maintenance Management</h2>
              <p className="text-muted-foreground">Schedule and track vehicle maintenance</p>
            </div>
            <Button onClick={() => setShowMaintenanceForm(true)} className="apple-button">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl">
                Overview
              </TabsTrigger>
              <TabsTrigger value="daily-checks" className="rounded-xl">
                Daily Checks
              </TabsTrigger>
              <TabsTrigger value="form-builder" className="rounded-xl">
                Form Builder
              </TabsTrigger>
              <TabsTrigger value="admin-review" className="rounded-xl">
                Admin Review
              </TabsTrigger>
              <TabsTrigger value="calendar" className="rounded-xl">
                Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="apple-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Maintenance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {maintenanceRecords
                        .filter((record) => !record.completed_date)
                        .slice(0, 5)
                        .map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-xl">
                            <div className="flex items-center space-x-3">
                              <Wrench className="h-4 w-4 text-accent" />
                              <div>
                                <p className="text-sm font-medium">{record.vehicle?.vehicle_number}</p>
                                <p className="text-xs text-muted-foreground">{record.description}</p>
                              </div>
                            </div>
                            <Badge variant="default" className="text-xs rounded-lg">
                              {new Date(record.scheduled_date).toLocaleDateString()}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="apple-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Overdue Maintenance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {maintenanceRecords
                        .filter((record) => !record.completed_date && new Date(record.scheduled_date) < new Date())
                        .slice(0, 5)
                        .map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-xl">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <div>
                                <p className="text-sm font-medium">{record.vehicle?.vehicle_number}</p>
                                <p className="text-xs text-muted-foreground">{record.description}</p>
                              </div>
                            </div>
                            <Badge variant="destructive" className="text-xs rounded-lg">
                              Overdue
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="apple-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Completions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {maintenanceRecords
                        .filter((record) => record.completed_date)
                        .slice(0, 5)
                        .map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-xl">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-4 w-4 text-secondary" />
                              <div>
                                <p className="text-sm font-medium">{record.vehicle?.vehicle_number}</p>
                                <p className="text-xs text-muted-foreground">{record.description}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs rounded-lg">
                              {record.completed_date ? new Date(record.completed_date).toLocaleDateString() : "N/A"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="daily-checks">
              <DailyCheckSubmission vehicles={vehicles} />
            </TabsContent>

            <TabsContent value="form-builder">
              <DailyCheckFormBuilder />
            </TabsContent>

            <TabsContent value="admin-review">
              <DailyCheckAdminDashboard />
            </TabsContent>

            <TabsContent value="calendar">
              <MaintenanceCalendar onSelectMaintenance={handleSelectMaintenance} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-serif font-bold">Fleet Analytics & Reports</h2>
              <p className="text-muted-foreground">Comprehensive fleet performance insights and reporting</p>
            </div>
          </div>
          <FleetAnalytics />
        </TabsContent>
      </Tabs>

      {/* Vehicle Form Dialog */}
      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <VehicleForm
            vehicle={selectedVehicle || undefined}
            onSave={handleVehicleSave}
            onCancel={() => {
              setShowVehicleForm(false)
              setSelectedVehicle(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Vehicle Detail Dialog */}
      <Dialog open={showVehicleDetail} onOpenChange={setShowVehicleDetail}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedVehicle && (
            <VehicleDetail
              vehicleId={selectedVehicle.id}
              onEdit={() => {
                setShowVehicleDetail(false)
                setShowVehicleForm(true)
              }}
              onDelete={handleDeleteVehicle}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance Form Dialog */}
      <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <MaintenanceForm
            maintenance={selectedMaintenance || undefined}
            onSave={handleMaintenanceSave}
            onCancel={() => {
              setShowMaintenanceForm(false)
              setSelectedMaintenance(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
