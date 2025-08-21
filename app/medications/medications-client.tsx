"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { format, differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MedicationForm } from "@/components/medication-form"
import { Plus, Pill, AlertTriangle, Clock, TrendingDown, Search, Filter, Calendar, Package } from "lucide-react"
import type { Medication, Location } from "@/lib/types"

interface MedicationsClientProps {
  medications: Medication[]
  locations: Location[]
  userRole: string
}

export function MedicationsClient({ medications: initialMedications, locations, userRole }: MedicationsClientProps) {
  const [medications, setMedications] = useState<Medication[]>(initialMedications)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "expired" | "expiring" | "low_stock" | "good">("all")
  const [sortBy, setSortBy] = useState<"expiration" | "name" | "quantity">("expiration")
  const [isMedicationFormOpen, setIsMedicationFormOpen] = useState(false)
  const router = useRouter()

  const supabase = createClient()
  const isAdmin = userRole === "admin"

  // Calculate statistics
  const totalMedications = medications.length
  const expiredCount = medications.filter(
    (med) => med.expiration_date && new Date(med.expiration_date) < new Date(),
  ).length
  const expiringSoonCount = medications.filter((med) => {
    if (!med.expiration_date) return false
    const expirationDate = new Date(med.expiration_date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expirationDate <= thirtyDaysFromNow && expirationDate >= new Date()
  }).length
  const lowStockCount = medications.filter((med) => med.quantity < med.min_par_level && med.min_par_level > 0).length
  const goodCount = medications.filter((med) => {
    const isNotExpired = !med.expiration_date || new Date(med.expiration_date) >= new Date()
    const isNotExpiringSoon =
      !med.expiration_date ||
      (() => {
        const expirationDate = new Date(med.expiration_date)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return expirationDate > thirtyDaysFromNow
      })()
    const isNotLowStock = med.quantity >= med.min_par_level || med.min_par_level === 0
    return isNotExpired && isNotExpiringSoon && isNotLowStock
  }).length

  // Filter and sort medications
  const filteredAndSortedMedications = medications
    .filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.location_name.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      switch (filterStatus) {
        case "expired":
          return med.expiration_date && new Date(med.expiration_date) < new Date()
        case "expiring":
          if (!med.expiration_date) return false
          const expirationDate = new Date(med.expiration_date)
          const thirtyDaysFromNow = new Date()
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
          return expirationDate <= thirtyDaysFromNow && expirationDate >= new Date()
        case "low_stock":
          return med.quantity < med.min_par_level && med.min_par_level > 0
        case "good":
          const isNotExpired = !med.expiration_date || new Date(med.expiration_date) >= new Date()
          const isNotExpiringSoon =
            !med.expiration_date ||
            (() => {
              const expDate = new Date(med.expiration_date)
              const thirtyDays = new Date()
              thirtyDays.setDate(thirtyDays.getDate() + 30)
              return expDate > thirtyDays
            })()
          const isNotLowStock = med.quantity >= med.min_par_level || med.min_par_level === 0
          return isNotExpired && isNotExpiringSoon && isNotLowStock
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "expiration":
          const aDate = a.expiration_date ? new Date(a.expiration_date) : new Date("9999-12-31")
          const bDate = b.expiration_date ? new Date(b.expiration_date) : new Date("9999-12-31")
          return aDate.getTime() - bDate.getTime()
        case "name":
          return a.name.localeCompare(b.name)
        case "quantity":
          return a.quantity - b.quantity
        default:
          return 0
      }
    })

  const getExpirationStatus = (medication: Medication) => {
    if (!medication.expiration_date) {
      return { status: "no-expiration", label: "No Expiration", variant: "outline" as const, days: null }
    }

    const expirationDate = new Date(medication.expiration_date)
    const today = new Date()
    const daysUntilExpiration = differenceInDays(expirationDate, today)

    if (daysUntilExpiration < 0) {
      return {
        status: "expired",
        label: "Expired",
        variant: "destructive" as const,
        days: Math.abs(daysUntilExpiration),
      }
    } else if (daysUntilExpiration <= 7) {
      return { status: "critical", label: "Critical", variant: "destructive" as const, days: daysUntilExpiration }
    } else if (daysUntilExpiration <= 30) {
      return { status: "warning", label: "Expiring Soon", variant: "secondary" as const, days: daysUntilExpiration }
    } else {
      return { status: "good", label: "Good", variant: "outline" as const, days: daysUntilExpiration }
    }
  }

  const getStockStatus = (medication: Medication) => {
    if (medication.quantity === 0) {
      return { status: "out", label: "Out of Stock", variant: "destructive" as const }
    } else if (medication.quantity < medication.min_par_level && medication.min_par_level > 0) {
      return { status: "low", label: "Low Stock", variant: "secondary" as const }
    } else {
      return { status: "good", label: "In Stock", variant: "outline" as const }
    }
  }

  const handleAddMedication = () => {
    setIsMedicationFormOpen(true)
  }

  const handleSaveMedication = async (medicationData: any) => {
    console.log("[v0] Submitting medication form:", medicationData)

    const response = await fetch("/api/medications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(medicationData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "Failed to create medication")
    }

    console.log("[v0] Medication created successfully:", result)

    // Refresh the page after successful creation
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  return (
    <div className="h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Medications Inventory</h1>
            <p className="text-lg text-muted-foreground font-medium">
              Track pharmaceutical supplies and monitor expiration dates
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAddMedication} className="apple-button-secondary">
              <Plus className="h-5 w-5 mr-2" />
              Add Medication
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 transition-transform duration-200 group-hover:scale-110">
                  <Pill className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-primary mb-2">{totalMedications}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Medications</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-destructive/10 transition-transform duration-200 group-hover:scale-110">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-destructive mb-2">{expiredCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Expired</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-orange-100 transition-transform duration-200 group-hover:scale-110">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-orange-600 mb-2">{expiringSoonCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Expiring Soon</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-destructive/10 transition-transform duration-200 group-hover:scale-110">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-destructive mb-2">{lowStockCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Low Stock</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-secondary/10 transition-transform duration-200 group-hover:scale-110">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-secondary mb-2">{goodCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Good Status</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(expiredCount > 0 || expiringSoonCount > 0 || lowStockCount > 0) && (
          <Card className="apple-card border-destructive/30 bg-gradient-to-r from-destructive/5 to-orange-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-destructive">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="font-serif font-bold">Medication Alerts</span>
              </CardTitle>
              <CardDescription className="text-base">
                Critical medications requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {expiredCount > 0 && (
                  <Badge variant="destructive" className="text-sm font-medium px-3 py-1 rounded-xl">
                    {expiredCount} expired medications
                  </Badge>
                )}
                {expiringSoonCount > 0 && (
                  <Badge className="text-sm font-medium px-3 py-1 rounded-xl bg-orange-500 text-white hover:bg-orange-600">
                    {expiringSoonCount} expiring within 30 days
                  </Badge>
                )}
                {lowStockCount > 0 && (
                  <Badge variant="destructive" className="text-sm font-medium px-3 py-1 rounded-xl">
                    {lowStockCount} medications low in stock
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="apple-card">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-serif font-bold text-primary">Medications List</CardTitle>
                <CardDescription className="text-base font-medium mt-2">
                  Monitor pharmaceutical inventory and expiration dates • {filteredAndSortedMedications.length} of{" "}
                  {medications.length} medications shown
                </CardDescription>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search medications, lot numbers, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-56 h-12 rounded-2xl border-border/50 bg-card">
                    <Filter className="h-5 w-5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50">
                    <SelectItem value="all">All Medications ({totalMedications})</SelectItem>
                    <SelectItem value="expired">Expired ({expiredCount})</SelectItem>
                    <SelectItem value="expiring">Expiring Soon ({expiringSoonCount})</SelectItem>
                    <SelectItem value="low_stock">Low Stock ({lowStockCount})</SelectItem>
                    <SelectItem value="good">Good Status ({goodCount})</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48 h-12 rounded-2xl border-border/50 bg-card">
                    <Calendar className="h-5 w-5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/50">
                    <SelectItem value="expiration">Sort by Expiration</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="quantity">Sort by Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-base h-14">Medication Details</TableHead>
                    <TableHead className="font-semibold text-base h-14">Location</TableHead>
                    <TableHead className="font-semibold text-base h-14">Stock Level</TableHead>
                    <TableHead className="font-semibold text-base h-14">Expiration Date</TableHead>
                    <TableHead className="font-semibold text-base h-14">Days Until Expiry</TableHead>
                    <TableHead className="font-semibold text-base h-14">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMedications.map((medication) => {
                    const expirationStatus = getExpirationStatus(medication)
                    const stockStatus = getStockStatus(medication)

                    return (
                      <TableRow key={medication.id} className="hover:bg-muted/20 transition-all duration-200 h-16">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground text-base">{medication.name}</div>
                            {medication.description && (
                              <div className="text-sm text-muted-foreground font-medium">{medication.description}</div>
                            )}
                            {medication.lot_number && (
                              <div className="text-xs text-muted-foreground font-medium">
                                Lot: {medication.lot_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-foreground font-medium">
                            {medication.storage_unit_name
                              ? `${medication.location_name} > ${medication.storage_unit_name}`
                              : medication.location_name}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground text-base">
                              {medication.quantity} {medication.unit_of_measure}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                              Par: {medication.min_par_level} {medication.unit_of_measure}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {medication.expiration_date ? (
                            <div className="text-sm text-foreground font-medium">
                              {format(new Date(medication.expiration_date), "MMM dd, yyyy")}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground font-medium">No expiration</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {expirationStatus.days !== null ? (
                            <div
                              className={`text-sm font-medium ${
                                expirationStatus.status === "expired"
                                  ? "text-destructive"
                                  : expirationStatus.status === "critical"
                                    ? "text-destructive"
                                    : expirationStatus.status === "warning"
                                      ? "text-orange-600"
                                      : "text-foreground"
                              }`}
                            >
                              {expirationStatus.status === "expired"
                                ? `${expirationStatus.days} days ago`
                                : `${expirationStatus.days} days`}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground font-medium">N/A</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant={expirationStatus.variant}
                              className="text-xs font-medium px-2 py-1 rounded-lg w-fit"
                            >
                              {expirationStatus.label}
                            </Badge>
                            <Badge
                              variant={stockStatus.variant}
                              className="text-xs font-medium px-2 py-1 rounded-lg w-fit"
                            >
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredAndSortedMedications.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="p-6 rounded-3xl bg-muted/20 inline-flex mb-6">
                  <Pill className="h-12 w-12 opacity-50" />
                </div>
                <p className="text-xl font-serif font-bold mb-2">No medications found</p>
                <p className="text-base font-medium">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog component for adding medication */}
      {isAdmin && (
        <MedicationForm
          isOpen={isMedicationFormOpen}
          onClose={() => setIsMedicationFormOpen(false)}
          onSave={handleSaveMedication}
          locations={locations}
        />
      )}
    </div>
  )
}
