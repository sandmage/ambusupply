"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Calendar, Package, Plus, Search, Truck } from "lucide-react"

interface Medication {
  id: string
  name: string
  concentration: string
  lotNumber: string
  expirationDate: string
  quantity: number
  location: string
  vehicleId?: string
  controlledSubstance: boolean
  schedule?: string
  ndc: string
}

export default function MedicationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("all")
  const [filterExpiration, setFilterExpiration] = useState("all")

  // Mock data for medications
  const medications: Medication[] = [
    {
      id: "MED-001",
      name: "Morphine Sulfate",
      concentration: "10mg/ml",
      lotNumber: "MS2024001",
      expirationDate: "2024-12-15",
      quantity: 25,
      location: "Main Supply",
      controlledSubstance: true,
      schedule: "Schedule II",
      ndc: "0409-1234-01",
    },
    {
      id: "MED-002",
      name: "Epinephrine",
      concentration: "1mg/ml",
      lotNumber: "EP2024002",
      expirationDate: "2025-03-20",
      quantity: 15,
      location: "AMB-001",
      vehicleId: "AMB-001",
      controlledSubstance: false,
      ndc: "0409-5678-01",
    },
    {
      id: "MED-003",
      name: "Naloxone",
      concentration: "0.4mg/ml",
      lotNumber: "NX2024003",
      expirationDate: "2024-11-30",
      quantity: 8,
      location: "AMB-002",
      vehicleId: "AMB-002",
      controlledSubstance: false,
      ndc: "0409-9012-01",
    },
    {
      id: "MED-004",
      name: "Atropine",
      concentration: "1mg/ml",
      lotNumber: "AT2024004",
      expirationDate: "2025-01-15",
      quantity: 30,
      location: "Main Supply",
      controlledSubstance: false,
      ndc: "0409-3456-01",
    },
    {
      id: "MED-005",
      name: "Fentanyl",
      concentration: "50mcg/ml",
      lotNumber: "FT2024005",
      expirationDate: "2024-10-25",
      quantity: 12,
      location: "AMB-003",
      vehicleId: "AMB-003",
      controlledSubstance: true,
      schedule: "Schedule II",
      ndc: "0409-7890-01",
    },
  ]

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date()
    const expDate = new Date(expirationDate)
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (daysUntilExpiration < 0) return { status: "expired", color: "destructive", days: Math.abs(daysUntilExpiration) }
    if (daysUntilExpiration <= 30) return { status: "expiring-soon", color: "destructive", days: daysUntilExpiration }
    if (daysUntilExpiration <= 90) return { status: "warning", color: "warning", days: daysUntilExpiration }
    return { status: "good", color: "default", days: daysUntilExpiration }
  }

  const filteredMedications = medications.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.ndc.includes(searchTerm)

    const matchesLocation =
      filterLocation === "all" ||
      (filterLocation === "main" && med.location === "Main Supply") ||
      (filterLocation === "vehicles" && med.vehicleId)

    const expStatus = getExpirationStatus(med.expirationDate)
    const matchesExpiration =
      filterExpiration === "all" ||
      (filterExpiration === "expired" && expStatus.status === "expired") ||
      (filterExpiration === "expiring" && expStatus.status === "expiring-soon") ||
      (filterExpiration === "warning" && expStatus.status === "warning")

    return matchesSearch && matchesLocation && matchesExpiration
  })

  const mainSupplyMeds = filteredMedications.filter((med) => med.location === "Main Supply")
  const vehicleMeds = filteredMedications.filter((med) => med.vehicleId)

  const getExpirationStats = () => {
    const expired = medications.filter((med) => getExpirationStatus(med.expirationDate).status === "expired").length
    const expiringSoon = medications.filter(
      (med) => getExpirationStatus(med.expirationDate).status === "expiring-soon",
    ).length
    const warning = medications.filter((med) => getExpirationStatus(med.expirationDate).status === "warning").length
    const controlled = medications.filter((med) => med.controlledSubstance).length

    return { expired, expiringSoon, warning, controlled }
  }

  const stats = getExpirationStats()

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medications Management</h1>
          <p className="text-muted-foreground">Track medications and expiration dates across all locations</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Controlled Substances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.controlled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medications, lot numbers, or NDC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="main">Main Supply</SelectItem>
                <SelectItem value="vehicles">Vehicles</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterExpiration} onValueChange={setFilterExpiration}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medications</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="warning">Warning (90 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medications by Location */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="main-supply">Main Supply</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {filteredMedications.map((med) => {
              const expStatus = getExpirationStatus(med.expirationDate)
              return (
                <Card key={med.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{med.name}</h3>
                          <Badge variant="outline">{med.concentration}</Badge>
                          {med.controlledSubstance && (
                            <Badge variant="destructive" className="text-xs">
                              {med.schedule}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <span>Lot: {med.lotNumber}</span>
                            <span>NDC: {med.ndc}</span>
                            <span>Qty: {med.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {med.vehicleId ? (
                              <div className="flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                <span>{med.location}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                <span>{med.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{med.expirationDate}</span>
                          </div>
                          <Badge
                            variant={expStatus.color === "destructive" ? "destructive" : "secondary"}
                            className={expStatus.color === "warning" ? "bg-orange-100 text-orange-800" : ""}
                          >
                            {expStatus.status === "expired"
                              ? `Expired ${expStatus.days} days ago`
                              : expStatus.status === "expiring-soon"
                                ? `Expires in ${expStatus.days} days`
                                : expStatus.status === "warning"
                                  ? `Expires in ${expStatus.days} days`
                                  : `Expires in ${expStatus.days} days`}
                          </Badge>
                        </div>
                        {(expStatus.status === "expired" || expStatus.status === "expiring-soon") && (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="main-supply" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Main Supply Medications</CardTitle>
              <CardDescription>Medications stored in the main supply facility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mainSupplyMeds.map((med) => {
                  const expStatus = getExpirationStatus(med.expirationDate)
                  return (
                    <div key={med.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{med.name}</span>
                          <Badge variant="outline">{med.concentration}</Badge>
                          {med.controlledSubstance && (
                            <Badge variant="destructive" className="text-xs">
                              {med.schedule}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Lot: {med.lotNumber} | Qty: {med.quantity} | NDC: {med.ndc}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{med.expirationDate}</div>
                        <Badge
                          variant={expStatus.color === "destructive" ? "destructive" : "secondary"}
                          className={expStatus.color === "warning" ? "bg-orange-100 text-orange-800" : ""}
                        >
                          {expStatus.status === "expired" ? "Expired" : `${expStatus.days} days`}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid gap-4">
            {Array.from(new Set(vehicleMeds.map((med) => med.vehicleId))).map((vehicleId) => {
              const vehicleMedications = vehicleMeds.filter((med) => med.vehicleId === vehicleId)
              return (
                <Card key={vehicleId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {vehicleId}
                    </CardTitle>
                    <CardDescription>{vehicleMedications.length} medications on board</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vehicleMedications.map((med) => {
                        const expStatus = getExpirationStatus(med.expirationDate)
                        return (
                          <div key={med.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{med.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {med.concentration}
                                </Badge>
                                {med.controlledSubstance && (
                                  <Badge variant="destructive" className="text-xs">
                                    {med.schedule}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Lot: {med.lotNumber} | Qty: {med.quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs">{med.expirationDate}</div>
                              <Badge
                                variant={expStatus.color === "destructive" ? "destructive" : "secondary"}
                                className={`text-xs ${expStatus.color === "warning" ? "bg-orange-100 text-orange-800" : ""}`}
                              >
                                {expStatus.status === "expired" ? "Expired" : `${expStatus.days}d`}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
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
