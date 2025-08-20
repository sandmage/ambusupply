"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Car, User, Clock, Calendar, Plus, X, CheckCircle, AlertTriangle } from "lucide-react"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  status: string
}

interface Driver {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  status: string
  license_expiry: string
}

interface Assignment {
  id: string
  vehicle_id: string
  driver_id: string
  assigned_at: string
  unassigned_at?: string
  shift_start?: string
  shift_end?: string
  notes?: string
  vehicle?: Vehicle
  driver?: Driver
}

interface AssignmentBoardProps {
  onAssignmentChange?: () => void
}

export function AssignmentBoard({ onAssignmentChange }: AssignmentBoardProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    driver_id: "",
    shift_start: "",
    shift_end: "",
    notes: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active")
        .order("vehicle_number")

      // Fetch drivers
      const { data: driversData } = await supabase.from("drivers").select("*").order("last_name")

      // Fetch current assignments
      const { data: assignmentsData } = await supabase
        .from("vehicle_assignments")
        .select(`
          *,
          vehicle:vehicles(id, vehicle_number, make, model, status),
          driver:drivers(id, employee_id, first_name, last_name, status)
        `)
        .is("unassigned_at", null)
        .order("assigned_at", { ascending: false })

      setVehicles(vehiclesData || [])
      setDrivers(driversData || [])
      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setShowAssignDialog(true)
    setAssignmentForm({
      driver_id: "",
      shift_start: "",
      shift_end: "",
      notes: "",
    })
  }

  const handleCreateAssignment = async () => {
    if (!selectedVehicle || !assignmentForm.driver_id) return

    try {
      const { error } = await supabase.from("vehicle_assignments").insert([
        {
          vehicle_id: selectedVehicle.id,
          driver_id: assignmentForm.driver_id,
          shift_start: assignmentForm.shift_start || null,
          shift_end: assignmentForm.shift_end || null,
          notes: assignmentForm.notes || null,
        },
      ])

      if (error) throw error

      setShowAssignDialog(false)
      setSelectedVehicle(null)
      fetchData()
      onAssignmentChange?.()
    } catch (error) {
      console.error("Error creating assignment:", error)
    }
  }

  const handleUnassignVehicle = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("vehicle_assignments")
        .update({ unassigned_at: new Date().toISOString() })
        .eq("id", assignmentId)

      if (error) throw error

      fetchData()
      onAssignmentChange?.()
    } catch (error) {
      console.error("Error unassigning vehicle:", error)
    }
  }

  const getVehicleAssignment = (vehicleId: string) => {
    return assignments.find((assignment) => assignment.vehicle_id === vehicleId)
  }

  const getAvailableDrivers = () => {
    const assignedDriverIds = assignments.map((assignment) => assignment.driver_id)
    return drivers.filter((driver) => driver.status === "available" && !assignedDriverIds.includes(driver.id))
  }

  const getDriverStatusBadge = (status: string) => {
    const variants = {
      available: "secondary",
      assigned: "default",
      off_duty: "outline",
      on_leave: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="rounded-lg text-xs">
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiry <= thirtyDaysFromNow
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Assignments */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-primary" />
              <span>Vehicle Assignments</span>
            </CardTitle>
            <CardDescription>Current vehicle-driver assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicles.map((vehicle) => {
                const assignment = getVehicleAssignment(vehicle.id)
                return (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.vehicle_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {assignment ? (
                        <>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {assignment.driver?.first_name} {assignment.driver?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{assignment.driver?.employee_id}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassignVehicle(assignment.id)}
                            className="rounded-xl text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignVehicle(vehicle)}
                          className="rounded-xl"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Available Drivers */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-secondary" />
              <span>Available Drivers</span>
            </CardTitle>
            <CardDescription>Drivers ready for assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAvailableDrivers().map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {driver.first_name} {driver.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{driver.employee_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isLicenseExpiringSoon(driver.license_expiry) && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {getDriverStatusBadge(driver.status)}
                  </div>
                </div>
              ))}
              {getAvailableDrivers().length === 0 && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No available drivers</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments Summary */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle>Current Shift Assignments</CardTitle>
          <CardDescription>Active driver-vehicle assignments with shift details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-4 border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-secondary" />
                    <span className="font-medium">{assignment.vehicle?.vehicle_number}</span>
                  </div>
                  <Badge variant="secondary" className="rounded-lg text-xs">
                    Active
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {assignment.driver?.first_name} {assignment.driver?.last_name}
                    </span>
                  </div>
                  {assignment.shift_start && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(assignment.shift_start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {assignment.shift_end &&
                          ` - ${new Date(assignment.shift_end).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {assignment.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">{assignment.notes}</p>
                )}
              </div>
            ))}
          </div>
          {assignments.length === 0 && (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active assignments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver to Vehicle</DialogTitle>
            <DialogDescription>Assign a driver to {selectedVehicle?.vehicle_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Driver</Label>
              <Select
                value={assignmentForm.driver_id}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, driver_id: value }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDrivers().map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name} ({driver.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_start">Shift Start</Label>
                <Input
                  id="shift_start"
                  type="time"
                  value={assignmentForm.shift_start}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, shift_start: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_end">Shift End</Label>
                <Input
                  id="shift_end"
                  type="time"
                  value={assignmentForm.shift_end}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, shift_end: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special instructions..."
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateAssignment}
                disabled={!assignmentForm.driver_id}
                className="apple-button flex-1"
              >
                Assign Driver
              </Button>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="flex-1 rounded-2xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
