"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Truck, CheckCircle, AlertTriangle, Clock, User, Calendar } from "lucide-react"
import { toast } from "sonner"

interface CheckItem {
  id: string
  category: string
  item: string
  status: "pass" | "fail" | "na" | null
  notes?: string
}

interface DailyCheck {
  vehicleId: string
  inspectorName: string
  date: string
  mileage: string
  fuelLevel: string
  items: CheckItem[]
  overallStatus: "pass" | "fail" | "incomplete"
  notes: string
}

export default function DailyChecksPage() {
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [inspectorName, setInspectorName] = useState("")
  const [mileage, setMileage] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  const [notes, setNotes] = useState("")

  const vehicles = [
    { id: "AMB-001", status: "needs-check", lastCheck: "2024-01-14" },
    { id: "AMB-007", status: "completed", lastCheck: "2024-01-15" },
    { id: "AMB-012", status: "needs-check", lastCheck: "2024-01-13" },
    { id: "AMB-015", status: "maintenance", lastCheck: "2024-01-10" },
  ]

  const [checkItems, setCheckItems] = useState<CheckItem[]>([
    // Exterior Checks
    { id: "ext-1", category: "Exterior", item: "Body damage inspection", status: null },
    { id: "ext-2", category: "Exterior", item: "Lights (headlights, taillights, emergency)", status: null },
    { id: "ext-3", category: "Exterior", item: "Tires condition and pressure", status: null },
    { id: "ext-4", category: "Exterior", item: "Mirrors and windows", status: null },
    { id: "ext-5", category: "Exterior", item: "License plates and registration", status: null },

    // Interior Checks
    { id: "int-1", category: "Interior", item: "Seat belts and restraints", status: null },
    { id: "int-2", category: "Interior", item: "Dashboard warning lights", status: null },
    { id: "int-3", category: "Interior", item: "Radio and communication equipment", status: null },
    { id: "int-4", category: "Interior", item: "Air conditioning/heating", status: null },
    { id: "int-5", category: "Interior", item: "Interior cleanliness", status: null },

    // Engine/Mechanical
    { id: "mech-1", category: "Mechanical", item: "Engine oil level", status: null },
    { id: "mech-2", category: "Mechanical", item: "Coolant level", status: null },
    { id: "mech-3", category: "Mechanical", item: "Brake fluid level", status: null },
    { id: "mech-4", category: "Mechanical", item: "Battery condition", status: null },
    { id: "mech-5", category: "Mechanical", item: "Unusual noises or vibrations", status: null },

    // Medical Equipment
    { id: "med-1", category: "Medical Equipment", item: "Oxygen tanks (15L) - quantity and pressure", status: null },
    { id: "med-2", category: "Medical Equipment", item: "Defibrillator (charged and functional)", status: null },
    { id: "med-3", category: "Medical Equipment", item: "Cardiac monitor and leads", status: null },
    { id: "med-4", category: "Medical Equipment", item: "Stretcher operation and restraints", status: null },
    { id: "med-5", category: "Medical Equipment", item: "Suction unit functionality", status: null },
    { id: "med-6", category: "Medical Equipment", item: "Blood pressure cuffs (adult/pediatric)", status: null },
    { id: "med-7", category: "Medical Equipment", item: "Pulse oximeter", status: null },
    { id: "med-8", category: "Medical Equipment", item: "Spine board and cervical collars", status: null },
    { id: "med-9", category: "Medical Equipment", item: "Bag valve mask (adult/pediatric)", status: null },

    // Medical Supplies
    {
      id: "sup-1",
      category: "Medical Supplies",
      item: "Emergency medications (epinephrine, albuterol, etc.)",
      status: null,
    },
    {
      id: "sup-2",
      category: "Medical Supplies",
      item: "IV supplies and fluids (normal saline, lactated ringers)",
      status: null,
    },
    { id: "sup-3", category: "Medical Supplies", item: "Bandages and wound care supplies", status: null },
    { id: "sup-4", category: "Medical Supplies", item: "Airway management supplies (intubation kit)", status: null },
    {
      id: "sup-5",
      category: "Medical Supplies",
      item: "Splinting materials (SAM splints, traction splint)",
      status: null,
    },
    {
      id: "sup-6",
      category: "Medical Supplies",
      item: "Burn treatment supplies (burn sheets, cool gel)",
      status: null,
    },
    { id: "sup-7", category: "Medical Supplies", item: "Obstetric kit (delivery supplies)", status: null },
    {
      id: "sup-8",
      category: "Medical Supplies",
      item: "Pediatric supplies (pediatric doses, equipment)",
      status: null,
    },
    { id: "sup-9", category: "Medical Supplies", item: "Glucose testing supplies", status: null },
    { id: "sup-10", category: "Medical Supplies", item: "Narcan (naloxone) supply", status: null },
    { id: "sup-11", category: "Medical Supplies", item: "Aspirin and nitroglycerin", status: null },
    { id: "sup-12", category: "Medical Supplies", item: "Thermometer and blood glucose meter", status: null },

    // Safety Equipment
    { id: "safe-1", category: "Safety", item: "Fire extinguisher", status: null },
    { id: "safe-2", category: "Safety", item: "First aid kit", status: null },
    { id: "safe-3", category: "Safety", item: "Emergency triangles/flares", status: null },
    { id: "safe-4", category: "Safety", item: "Personal protective equipment (gloves, masks, gowns)", status: null },
    { id: "safe-5", category: "Safety", item: "Emergency contact information", status: null },
    { id: "safe-6", category: "Safety", item: "Spill cleanup kit", status: null },
    { id: "safe-7", category: "Safety", item: "Sharps disposal container", status: null },
  ])

  const updateCheckItem = (id: string, status: "pass" | "fail" | "na", notes?: string) => {
    setCheckItems((prev) => prev.map((item) => (item.id === id ? { ...item, status, notes } : item)))
  }

  const getOverallStatus = () => {
    const completedItems = checkItems.filter((item) => item.status !== null)
    if (completedItems.length === 0) return "incomplete"

    const failedItems = checkItems.filter((item) => item.status === "fail")
    return failedItems.length > 0 ? "fail" : "pass"
  }

  const handleSubmit = () => {
    if (!selectedVehicle || !inspectorName) {
      toast.error("Missing Information", {
        description: "Please select a vehicle and enter inspector name.",
      })
      return
    }

    const completedItems = checkItems.filter((item) => item.status !== null)
    if (completedItems.length < checkItems.length) {
      toast.error("Incomplete Inspection", {
        description: `${checkItems.length - completedItems.length} items still need to be checked.`,
      })
      return
    }

    const overallStatus = getOverallStatus()

    if (mileage) {
      const existingVehicles = JSON.parse(localStorage.getItem("fleetVehicles") || "[]")
      const updatedVehicles = existingVehicles.map((vehicle: any) => {
        if (vehicle.id === selectedVehicle) {
          return {
            ...vehicle,
            mileage: `${Number.parseInt(mileage.replace(/,/g, "")).toLocaleString()} mi`,
            lastDailyCheck: new Date().toISOString().split("T")[0],
            dailyCheckStatus: overallStatus === "pass" ? "completed" : "needs-attention",
          }
        }
        return vehicle
      })
      localStorage.setItem("fleetVehicles", JSON.stringify(updatedVehicles))

      // Trigger a custom event to notify other components of the update
      window.dispatchEvent(
        new CustomEvent("vehicleDataUpdated", {
          detail: {
            vehicleId: selectedVehicle,
            mileage: `${Number.parseInt(mileage.replace(/,/g, "")).toLocaleString()} mi`,
          },
        }),
      )
    }

    toast.success("Daily Check Completed", {
      description: `${selectedVehicle} inspection ${overallStatus === "pass" ? "passed" : "failed"}. ${overallStatus === "fail" ? "Vehicle requires attention before service." : "Vehicle cleared for service."} ${mileage ? `Mileage updated to ${Number.parseInt(mileage.replace(/,/g, "")).toLocaleString()} mi.` : ""}`,
    })

    // Reset form
    setSelectedVehicle("")
    setInspectorName("")
    setMileage("")
    setFuelLevel("")
    setNotes("")
    setCheckItems((prev) => prev.map((item) => ({ ...item, status: null, notes: undefined })))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed Today</Badge>
      case "needs-check":
        return <Badge className="bg-orange-100 text-orange-800">Needs Check</Badge>
      case "maintenance":
        return <Badge className="bg-red-100 text-red-800">In Maintenance</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const groupedItems = checkItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, CheckItem[]>,
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Vehicle Checks</h1>
            <p className="text-muted-foreground mt-1">Complete daily safety and equipment inspections</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 inline mr-1" />
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vehicle Selection Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVehicle === vehicle.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{vehicle.id}</span>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {getStatusBadge(vehicle.status)}
                      <div className="text-xs text-muted-foreground mt-1">Last check: {vehicle.lastCheck}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Inspection Form */}
          <div className="lg:col-span-3 space-y-6">
            {selectedVehicle ? (
              <>
                {/* Inspector Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Inspection Details - {selectedVehicle}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="inspector">Inspector Name</Label>
                        <Input
                          id="inspector"
                          value={inspectorName}
                          onChange={(e) => setInspectorName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mileage">Current Mileage</Label>
                        <Input
                          id="mileage"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          placeholder="e.g., 45,230"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fuel">Fuel Level (%)</Label>
                        <Input
                          id="fuel"
                          value={fuelLevel}
                          onChange={(e) => setFuelLevel(e.target.value)}
                          placeholder="e.g., 85"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Inspection Checklist */}
                {Object.entries(groupedItems).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <span className="font-medium">{item.item}</span>
                              <div className="flex items-center space-x-2">
                                {item.status === "pass" && <CheckCircle className="h-5 w-5 text-green-600" />}
                                {item.status === "fail" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                                {item.status === "na" && <Clock className="h-5 w-5 text-gray-600" />}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mb-3">
                              <Button
                                variant={item.status === "pass" ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateCheckItem(item.id, "pass")}
                                className={item.status === "pass" ? "bg-green-600 hover:bg-green-700" : ""}
                              >
                                Pass
                              </Button>
                              <Button
                                variant={item.status === "fail" ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateCheckItem(item.id, "fail")}
                                className={item.status === "fail" ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                Fail
                              </Button>
                              <Button
                                variant={item.status === "na" ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateCheckItem(item.id, "na")}
                                className={item.status === "na" ? "bg-gray-600 hover:bg-gray-700" : ""}
                              >
                                N/A
                              </Button>
                            </div>
                            {(item.status === "fail" || item.notes) && (
                              <Textarea
                                placeholder="Add notes or describe the issue..."
                                value={item.notes || ""}
                                onChange={(e) => updateCheckItem(item.id, item.status!, e.target.value)}
                                className="mt-2"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Additional Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Any additional observations or notes about the vehicle..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className={`${
                      getOverallStatus() === "fail" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    Complete Inspection
                    {getOverallStatus() === "fail" && <AlertTriangle className="h-4 w-4 ml-2" />}
                    {getOverallStatus() === "pass" && <CheckCircle className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Select a Vehicle</h3>
                  <p className="text-muted-foreground">
                    Choose a vehicle from the sidebar to begin the daily inspection.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
