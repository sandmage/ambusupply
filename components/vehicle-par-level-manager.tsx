"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Car,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  Search,
  Filter,
} from "lucide-react"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
}

interface VehicleInventoryItem {
  id: string
  vehicle_id: string
  inventory_item_id: string
  storage_unit_id?: string
  storage_location_id?: string
  current_quantity: number
  par_level_min: number
  par_level_max?: number
  expiration_date?: string
  lot_number?: string
  notes?: string
  inventory_item?: {
    name: string
    description?: string
    category?: string
    unit_of_measure: string
  }
  storage_unit?: {
    name: string
    unit_type: string
  }
  storage_location?: {
    name: string
    location_type: string
  }
}

interface ParLevelUpdate {
  id: string
  par_level_min: number
  par_level_max?: number
}

interface VehicleParLevelManagerProps {
  vehicles: Vehicle[]
}

export function VehicleParLevelManager({ vehicles }: VehicleParLevelManagerProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles.length > 0 ? vehicles[0] : null)
  const [inventoryItems, setInventoryItems] = useState<VehicleInventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [complianceFilter, setComplianceFilter] = useState("all")
  const [editingItems, setEditingItems] = useState<Set<string>>(new Set())
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, ParLevelUpdate>>(new Map())
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false)
  const [bulkUpdateData, setBulkUpdateData] = useState({
    category: "",
    adjustment_type: "percentage",
    adjustment_value: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleInventoryItems()
    }
  }, [selectedVehicle])

  const fetchVehicleInventoryItems = async () => {
    if (!selectedVehicle) return

    setLoading(true)
    try {
      const { data } = await supabase
        .from("vehicle_inventory_items")
        .select(`
          *,
          inventory_item:inventory_items(name, description, category, unit_of_measure),
          storage_unit:vehicle_storage_units(name, unit_type),
          storage_location:vehicle_storage_locations(name, location_type)
        `)
        .eq("vehicle_id", selectedVehicle.id)
        .order("inventory_item(name)")

      setInventoryItems(data || [])
    } catch (error) {
      console.error("Error fetching vehicle inventory items:", error)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceStatus = (item: VehicleInventoryItem) => {
    if (item.current_quantity < item.par_level_min) {
      return {
        status: "below_par",
        color: "destructive",
        text: "Below Par",
        icon: <TrendingDown className="h-3 w-3" />,
      }
    }
    if (item.par_level_max && item.current_quantity > item.par_level_max) {
      return {
        status: "above_par",
        color: "default",
        text: "Above Par",
        icon: <TrendingUp className="h-3 w-3" />,
      }
    }
    return {
      status: "compliant",
      color: "secondary",
      text: "Compliant",
      icon: <CheckCircle className="h-3 w-3" />,
    }
  }

  const handleEditToggle = (itemId: string) => {
    const newEditing = new Set(editingItems)
    if (newEditing.has(itemId)) {
      newEditing.delete(itemId)
      // Remove pending update if canceling edit
      const newPending = new Map(pendingUpdates)
      newPending.delete(itemId)
      setPendingUpdates(newPending)
    } else {
      newEditing.add(itemId)
      // Initialize pending update with current values
      const item = inventoryItems.find((i) => i.id === itemId)
      if (item) {
        const newPending = new Map(pendingUpdates)
        newPending.set(itemId, {
          id: itemId,
          par_level_min: item.par_level_min,
          par_level_max: item.par_level_max,
        })
        setPendingUpdates(newPending)
      }
    }
    setEditingItems(newEditing)
  }

  const handleParLevelChange = (itemId: string, field: "par_level_min" | "par_level_max", value: string) => {
    const newPending = new Map(pendingUpdates)
    const current = newPending.get(itemId)
    if (current) {
      newPending.set(itemId, {
        ...current,
        [field]: field === "par_level_max" && value === "" ? undefined : Number.parseInt(value) || 0,
      })
      setPendingUpdates(newPending)
    }
  }

  const handleSaveParLevel = async (itemId: string) => {
    const update = pendingUpdates.get(itemId)
    if (!update) return

    try {
      const { error } = await supabase
        .from("vehicle_inventory_items")
        .update({
          par_level_min: update.par_level_min,
          par_level_max: update.par_level_max,
        })
        .eq("id", itemId)

      if (error) throw error

      // Update local state
      setInventoryItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                par_level_min: update.par_level_min,
                par_level_max: update.par_level_max,
              }
            : item,
        ),
      )

      // Clear editing state
      const newEditing = new Set(editingItems)
      newEditing.delete(itemId)
      setEditingItems(newEditing)

      const newPending = new Map(pendingUpdates)
      newPending.delete(itemId)
      setPendingUpdates(newPending)
    } catch (error) {
      console.error("Error updating par level:", error)
    }
  }

  const handleBulkUpdate = async () => {
    if (!bulkUpdateData.adjustment_value || !selectedVehicle) return

    try {
      const adjustmentValue = Number.parseFloat(bulkUpdateData.adjustment_value)
      const isPercentage = bulkUpdateData.adjustment_type === "percentage"

      // Filter items by category if specified
      const itemsToUpdate = inventoryItems.filter((item) => {
        if (bulkUpdateData.category && item.inventory_item?.category !== bulkUpdateData.category) {
          return false
        }
        return true
      })

      // Calculate new par levels
      const updates = itemsToUpdate.map((item) => {
        let newMinPar: number
        let newMaxPar: number | undefined

        if (isPercentage) {
          newMinPar = Math.max(1, Math.round(item.par_level_min * (1 + adjustmentValue / 100)))
          newMaxPar = item.par_level_max ? Math.round(item.par_level_max * (1 + adjustmentValue / 100)) : undefined
        } else {
          newMinPar = Math.max(1, item.par_level_min + adjustmentValue)
          newMaxPar = item.par_level_max ? item.par_level_max + adjustmentValue : undefined
        }

        return {
          id: item.id,
          par_level_min: newMinPar,
          par_level_max: newMaxPar,
        }
      })

      // Update database
      for (const update of updates) {
        const { error } = await supabase
          .from("vehicle_inventory_items")
          .update({
            par_level_min: update.par_level_min,
            par_level_max: update.par_level_max,
          })
          .eq("id", update.id)

        if (error) throw error
      }

      // Refresh data
      await fetchVehicleInventoryItems()
      setShowBulkUpdateDialog(false)
      setBulkUpdateData({ category: "", adjustment_type: "percentage", adjustment_value: "" })
    } catch (error) {
      console.error("Error performing bulk update:", error)
    }
  }

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.inventory_item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storage_unit?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storage_location?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const compliance = getComplianceStatus(item)
    const matchesCompliance = complianceFilter === "all" || compliance.status === complianceFilter

    return matchesSearch && matchesCompliance
  })

  const complianceStats = {
    total: inventoryItems.length,
    compliant: inventoryItems.filter((item) => getComplianceStatus(item).status === "compliant").length,
    belowPar: inventoryItems.filter((item) => getComplianceStatus(item).status === "below_par").length,
    abovePar: inventoryItems.filter((item) => getComplianceStatus(item).status === "above_par").length,
  }

  const categories = Array.from(
    new Set(inventoryItems.map((item) => item.inventory_item?.category).filter(Boolean)),
  ) as string[]

  return (
    <div className="space-y-6">
      {/* Vehicle Selection */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Par Level Management
          </CardTitle>
          <CardDescription>
            Manage minimum and maximum par levels for inventory items in specific vehicle locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={selectedVehicle?.id || "none"} // Updated default value to "none"
              onValueChange={(value) => {
                const vehicle = vehicles.find((v) => v.id === value)
                setSelectedVehicle(vehicle || null)
              }}
            >
              <SelectTrigger className="w-64 rounded-2xl">
                <SelectValue placeholder="Select vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.year} {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVehicle && (
              <Button onClick={() => setShowBulkUpdateDialog(true)} className="apple-button-secondary">
                Bulk Update Par Levels
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <div className="space-y-6">
          {/* Compliance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="apple-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{complianceStats.total}</p>
                  </div>
                  <Minus className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                    <p className="text-2xl font-bold text-secondary">{complianceStats.compliant}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Below Par</p>
                    <p className="text-2xl font-bold text-destructive">{complianceStats.belowPar}</p>
                  </div>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Above Par</p>
                    <p className="text-2xl font-bold text-accent">{complianceStats.abovePar}</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, storage units, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-2xl">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="below_par">Below Par</SelectItem>
                <SelectItem value="above_par">Above Par</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Par Levels Table */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card className="apple-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Min Par</TableHead>
                      <TableHead>Max Par</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const compliance = getComplianceStatus(item)
                      const isEditing = editingItems.has(item.id)
                      const pendingUpdate = pendingUpdates.get(item.id)

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.inventory_item?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.inventory_item?.category} • {item.inventory_item?.unit_of_measure}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.storage_unit?.name}</p>
                              {item.storage_location && (
                                <p className="text-sm text-muted-foreground">{item.storage_location.name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.current_quantity}</span>
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={pendingUpdate?.par_level_min || 0}
                                onChange={(e) => handleParLevelChange(item.id, "par_level_min", e.target.value)}
                                className="w-20"
                                min="0"
                              />
                            ) : (
                              <span className="font-medium">{item.par_level_min}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={pendingUpdate?.par_level_max || ""}
                                onChange={(e) => handleParLevelChange(item.id, "par_level_max", e.target.value)}
                                className="w-20"
                                min="0"
                                placeholder="None"
                              />
                            ) : (
                              <span className="font-medium">{item.par_level_max || "—"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={compliance.color as any} className="rounded-lg">
                              <span className="flex items-center gap-1">
                                {compliance.icon}
                                {compliance.text}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveParLevel(item.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditToggle(item.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditToggle(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Update Par Levels</DialogTitle>
            <DialogDescription>
              Apply percentage or fixed adjustments to par levels for multiple items at once
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category Filter (Optional)</Label>
              <Select
                value={bulkUpdateData.category}
                onValueChange={(value) =>
                  setBulkUpdateData({ ...bulkUpdateData, category: value === "all" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment_type">Adjustment Type</Label>
              <Select
                value={bulkUpdateData.adjustment_type}
                onValueChange={(value) => setBulkUpdateData({ ...bulkUpdateData, adjustment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment_value">
                Adjustment Value {bulkUpdateData.adjustment_type === "percentage" ? "(%)" : "(Units)"}
              </Label>
              <Input
                id="adjustment_value"
                type="number"
                value={bulkUpdateData.adjustment_value}
                onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, adjustment_value: e.target.value })}
                placeholder={
                  bulkUpdateData.adjustment_type === "percentage" ? "e.g., 10 for +10%" : "e.g., 2 for +2 units"
                }
              />
            </div>

            {bulkUpdateData.adjustment_value && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will {bulkUpdateData.adjustment_type === "percentage" ? "increase" : "add"}{" "}
                  {bulkUpdateData.adjustment_value}
                  {bulkUpdateData.adjustment_type === "percentage" ? "%" : " units"} to par levels for{" "}
                  {bulkUpdateData.category ? `${bulkUpdateData.category} items` : "all items"} in this vehicle.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={!bulkUpdateData.adjustment_value} className="apple-button">
              Apply Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
