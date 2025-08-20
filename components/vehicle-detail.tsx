"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Fuel, Wrench, User, Edit, Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react"

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
  created_at: string
  updated_at: string
}

interface MaintenanceRecord {
  id: string
  maintenance_type: string
  description: string
  scheduled_date: string
  completed_date?: string
  cost?: number
  service_provider?: string
}

interface FuelRecord {
  id: string
  fuel_amount: number
  cost_per_gallon?: number
  total_cost?: number
  odometer_reading?: number
  fueled_at: string
}

interface VehicleDetailProps {
  vehicleId: string
  onEdit: () => void
  onDelete: () => void
}

export function VehicleDetail({ vehicleId, onEdit, onDelete }: VehicleDetailProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchVehicleDetails()
  }, [vehicleId])

  const fetchVehicleDetails = async () => {
    try {
      // Fetch vehicle details
      const { data: vehicleData } = await supabase.from("vehicles").select("*").eq("id", vehicleId).single()

      // Fetch maintenance records
      const { data: maintenanceData } = await supabase
        .from("maintenance_records")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("scheduled_date", { ascending: false })

      // Fetch fuel records
      const { data: fuelData } = await supabase
        .from("fuel_records")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("fueled_at", { ascending: false })
        .limit(10)

      setVehicle(vehicleData)
      setMaintenanceRecords(maintenanceData || [])
      setFuelRecords(fuelData || [])
    } catch (error) {
      console.error("Error fetching vehicle details:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-secondary" />
      case "maintenance":
        return <Wrench className="h-5 w-5 text-accent" />
      case "out_of_service":
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-8">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Vehicle not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="apple-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(vehicle.status)}
              <div>
                <CardTitle className="text-2xl font-serif">{vehicle.vehicle_number}</CardTitle>
                <CardDescription>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(vehicle.status)}
              <Button variant="outline" size="sm" onClick={onEdit} className="rounded-xl bg-transparent">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="rounded-xl text-destructive hover:text-destructive bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                <p className="text-lg capitalize">{vehicle.vehicle_type.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIN</p>
                <p className="text-lg font-mono">{vehicle.vin}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">License Plate</p>
                <p className="text-lg font-mono">{vehicle.license_plate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Mileage</p>
                <p className="text-lg">{vehicle.mileage?.toLocaleString() || 0} miles</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fuel Capacity</p>
                <p className="text-lg">{vehicle.fuel_capacity || 0} gallons</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Added</p>
                <p className="text-lg">{new Date(vehicle.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Tabs */}
      <Tabs defaultValue="maintenance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="maintenance" className="rounded-xl">
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="fuel" className="rounded-xl">
            Fuel Records
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-xl">
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>Service records and scheduled maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex items-center space-x-4">
                        <Wrench className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">{record.description}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {record.maintenance_type} - {record.service_provider || "Internal"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{new Date(record.scheduled_date).toLocaleDateString()}</p>
                        <Badge variant={record.completed_date ? "secondary" : "destructive"} className="rounded-lg">
                          {record.completed_date ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No maintenance records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Fuel Records</CardTitle>
              <CardDescription>Recent fuel purchases and consumption</CardDescription>
            </CardHeader>
            <CardContent>
              {fuelRecords.length > 0 ? (
                <div className="space-y-4">
                  {fuelRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex items-center space-x-4">
                        <Fuel className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{record.fuel_amount} gallons</p>
                          <p className="text-sm text-muted-foreground">
                            {record.odometer_reading?.toLocaleString()} miles
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${record.total_cost?.toFixed(2) || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.fueled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No fuel records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Driver Assignments</CardTitle>
              <CardDescription>Current and historical driver assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assignments found</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
