"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, FileText, Calendar, Fuel, Eye, Edit, ClipboardCheck, Wrench, AlertTriangle, Clock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function FleetList() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState([
    {
      id: "AMB-001",
      status: "in-service",
      location: "Downtown Emergency",
      driver: "John Smith",
      fuel: 85,
      mileage: "45,230 mi",
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-04-10",
      type: "Advanced Life Support",
      serviceHours: "2 hours",
      dailyCheckStatus: "completed",
      lastDailyCheck: "2024-01-15",
      insuranceExpiry: "2024-12-15",
      registrationExpiry: "2024-11-30",
      lastOilChange: "2024-01-05",
      nextOilChange: "2024-04-05",
      complianceScore: 95,
      maintenancePriority: "low",
      documentsStatus: "current",
      totalMaintenanceCost: 1250.5,
    },
    {
      id: "AMB-007",
      status: "available",
      location: "Base Station",
      driver: "Available",
      fuel: 92,
      mileage: "32,150 mi",
      lastMaintenance: "2024-01-08",
      nextMaintenance: "2024-04-08",
      type: "Basic Life Support",
      serviceHours: null,
      dailyCheckStatus: "needs-check",
      lastDailyCheck: "2024-01-14",
      insuranceExpiry: "2024-10-20",
      registrationExpiry: "2024-09-15",
      lastOilChange: "2023-12-20",
      nextOilChange: "2024-03-20",
      complianceScore: 65,
      maintenancePriority: "high",
      documentsStatus: "expiring-soon",
      totalMaintenanceCost: 890.25,
    },
    {
      id: "AMB-012",
      status: "in-service",
      location: "General Hospital",
      driver: "Sarah Johnson",
      fuel: 67,
      mileage: "38,920 mi",
      lastMaintenance: "2024-01-12",
      nextMaintenance: "2024-04-12",
      type: "Critical Care",
      serviceHours: "45 minutes",
      dailyCheckStatus: "overdue",
      lastDailyCheck: "2024-01-13",
      insuranceExpiry: "2024-08-30",
      registrationExpiry: "2024-07-22",
      lastOilChange: "2024-01-10",
      nextOilChange: "2024-04-10",
      complianceScore: 80,
      maintenancePriority: "medium",
      documentsStatus: "current",
      totalMaintenanceCost: 2150.75,
    },
    {
      id: "AMB-015",
      status: "repair-shop",
      location: "Service Center",
      driver: "N/A",
      fuel: 45,
      mileage: "52,780 mi",
      lastMaintenance: "In Progress",
      nextMaintenance: "TBD",
      type: "Advanced Life Support",
      serviceHours: null,
      dailyCheckStatus: "na",
      lastDailyCheck: "2024-01-10",
      insuranceExpiry: "2024-06-15",
      registrationExpiry: "2024-05-10",
      lastOilChange: "2023-11-15",
      nextOilChange: "Overdue",
      complianceScore: 45,
      maintenancePriority: "critical",
      documentsStatus: "expired",
      totalMaintenanceCost: 3420.0,
    },
  ])

  useEffect(() => {
    const handleVehicleUpdate = (event: CustomEvent) => {
      const { vehicleId, mileage } = event.detail
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === vehicleId
            ? { ...vehicle, mileage, lastDailyCheck: new Date().toISOString().split("T")[0] }
            : vehicle,
        ),
      )
    }

    window.addEventListener("vehicleDataUpdated", handleVehicleUpdate as EventListener)

    const savedVehicles = localStorage.getItem("fleetVehicles")
    if (savedVehicles) {
      setVehicles(JSON.parse(savedVehicles))
    } else {
      localStorage.setItem("fleetVehicles", JSON.stringify(vehicles))
    }

    return () => {
      window.removeEventListener("vehicleDataUpdated", handleVehicleUpdate as EventListener)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>
      case "in-service":
        return <Badge className="bg-blue-100 text-blue-800">In Service</Badge>
      case "out-of-service":
        return <Badge className="bg-gray-100 text-gray-800">Out of Service</Badge>
      case "repair-shop":
        return <Badge className="bg-orange-100 text-orange-800">At Repair Shop</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getDailyCheckBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 text-xs">✓ Checked</Badge>
      case "needs-check":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Needs Check</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>
      case "na":
        return <Badge className="bg-gray-100 text-gray-800 text-xs">N/A</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Unknown
          </Badge>
        )
    }
  }

  const getMaintenancePriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 text-xs">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 text-xs">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800 text-xs">Low</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Unknown
          </Badge>
        )
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getFuelColor = (fuel: number) => {
    if (fuel > 70) return "text-green-600"
    if (fuel > 30) return "text-orange-600"
    return "text-red-600"
  }

  const handleView = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    toast.info(`Viewing ${vehicle?.id}`, {
      description: `Status: ${vehicle?.status} | Compliance: ${vehicle?.complianceScore}% | Maintenance: ${vehicle?.maintenancePriority}`,
    })
  }

  const handleEdit = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    toast.info(`Edit ${vehicle?.id}`, {
      description: "Vehicle edit form will open here. Feature in development.",
    })
  }

  const handleDailyCheck = (vehicleId: string) => {
    router.push(`/fleet/daily-checks?vehicle=${vehicleId}`)
  }

  const handleMaintenanceRecords = (vehicleId: string) => {
    router.push(`/fleet/maintenance?vehicle=${vehicleId}`)
  }

  const getMaintenanceStatus = (nextDate: string) => {
    if (nextDate === "Overdue" || nextDate === "TBD") return "overdue"
    const next = new Date(nextDate)
    const now = new Date()
    const daysUntil = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 30) return "due-soon"
    return "ok"
  }

  const getMaintenanceBadge = (nextDate: string) => {
    const status = getMaintenanceStatus(nextDate)
    switch (status) {
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 text-xs">Overdue</Badge>
      case "due-soon":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Due Soon</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Vehicle Records & Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <div className="font-semibold text-foreground">{vehicle.id}</div>
                  {getStatusBadge(vehicle.status)}
                  {getDailyCheckBadge(vehicle.dailyCheckStatus)}
                  {getMaintenanceBadge(vehicle.nextMaintenance)}
                  {getMaintenancePriorityBadge(vehicle.maintenancePriority)}
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(vehicle.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(vehicle.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDailyCheck(vehicle.id)}>
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMaintenanceRecords(vehicle.id)}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Compliance Score:</span>
                  <span className={`font-medium ${getComplianceColor(vehicle.complianceScore)}`}>
                    {vehicle.complianceScore}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Fuel className={`h-4 w-4 ${getFuelColor(vehicle.fuel)}`} />
                  <span className="text-muted-foreground">Fuel:</span>
                  <span className={`font-medium ${getFuelColor(vehicle.fuel)}`}>{vehicle.fuel}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Driver:</span>
                  <span className="font-medium ml-2">{vehicle.driver}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium ml-2">{vehicle.type}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Insurance Exp:</span>
                  <span
                    className={`font-medium ${getMaintenanceStatus(vehicle.insuranceExpiry) === "due-soon" ? "text-yellow-600" : getMaintenanceStatus(vehicle.insuranceExpiry) === "overdue" ? "text-red-600" : ""}`}
                  >
                    {vehicle.insuranceExpiry}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Registration Exp:</span>
                  <span
                    className={`font-medium ${getMaintenanceStatus(vehicle.registrationExpiry) === "due-soon" ? "text-yellow-600" : getMaintenanceStatus(vehicle.registrationExpiry) === "overdue" ? "text-red-600" : ""}`}
                  >
                    {vehicle.registrationExpiry}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Last Oil Change:</span>
                  <span className="font-medium ml-2">{vehicle.lastOilChange}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Next Oil Change:</span>
                  <span
                    className={`font-medium ml-2 ${vehicle.nextOilChange === "Overdue" ? "text-red-600" : getMaintenanceStatus(vehicle.nextOilChange) === "due-soon" ? "text-yellow-600" : ""}`}
                  >
                    {vehicle.nextOilChange}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Mileage:</span>
                  <span className="font-medium ml-2">{vehicle.mileage}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">YTD Maintenance:</span>
                  <span className="font-medium ml-2">${vehicle.totalMaintenanceCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Last Daily Check:</span>
                <span className="font-medium ml-2">{vehicle.lastDailyCheck}</span>
              </div>

              {vehicle.serviceHours && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Current Service Time:</span>
                  <span className="font-medium">{vehicle.serviceHours}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
