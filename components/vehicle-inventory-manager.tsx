"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Car,
  Package,
  MapPin,
  Archive,
  Plus,
  Search,
  Edit,
  ChevronDown,
  ChevronRight,
  Briefcase,
  ShoppingBag,
  Box,
} from "lucide-react"
import { VehicleStorageUnitForm } from "@/components/vehicle-storage-unit-form"
import { VehicleStorageLocationForm } from "@/components/vehicle-storage-location-form"
import { VehicleInventoryItemForm } from "@/components/vehicle-inventory-item-form"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
  status: string
}

interface VehicleStorageUnit {
  id: string
  vehicle_id: string
  name: string
  unit_type: string
  description?: string
  position_info?: any
  is_removable: boolean
  storage_locations?: VehicleStorageLocation[]
}

interface VehicleStorageLocation {
  id: string
  storage_unit_id: string
  name: string
  location_type: string
  description?: string
  position_info?: any
  access_notes?: string
  inventory_items?: VehicleInventoryItem[]
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
}

interface VehicleInventoryManagerProps {
  vehicles: Vehicle[]
}

export function VehicleInventoryManager({ vehicles }: VehicleInventoryManagerProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [storageUnits, setStorageUnits] = useState<VehicleStorageUnit[]>([])
  const [inventoryItems, setInventoryItems] = useState<VehicleInventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  // Form dialogs
  const [showStorageUnitForm, setShowStorageUnitForm] = useState(false)
  const [showStorageLocationForm, setShowStorageLocationForm] = useState(false)
  const [showInventoryItemForm, setShowInventoryItemForm] = useState(false)
  const [selectedStorageUnit, setSelectedStorageUnit] = useState<VehicleStorageUnit | null>(null)
  const [selectedStorageLocation, setSelectedStorageLocation] = useState<VehicleStorageLocation | null>(null)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<VehicleInventoryItem | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleInventoryData()
    }
  }, [selectedVehicle])

  const fetchVehicleInventoryData = async () => {
    if (!selectedVehicle) return

    setLoading(true)
    try {
      // Fetch storage units with their locations
      const { data: storageUnitsData } = await supabase
        .from("vehicle_storage_units")
        .select(`
          *,
          storage_locations:vehicle_storage_locations(*)
        `)
        .eq("vehicle_id", selectedVehicle.id)
        .order("name")

      // Fetch inventory items with their details
      const { data: inventoryItemsData } = await supabase
        .from("vehicle_inventory_items")
        .select(`
          *,
          inventory_item:inventory_items(name, description, category, unit_of_measure)
        `)
        .eq("vehicle_id", selectedVehicle.id)

      setStorageUnits(storageUnitsData || [])
      setInventoryItems(inventoryItemsData || [])
    } catch (error) {
      console.error("Error fetching vehicle inventory data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStorageUnitSave = () => {
    setShowStorageUnitForm(false)
    setSelectedStorageUnit(null)
    fetchVehicleInventoryData()
  }

  const handleStorageLocationSave = () => {
    setShowStorageLocationForm(false)
    setSelectedStorageLocation(null)
    fetchVehicleInventoryData()
  }

  const handleInventoryItemSave = () => {
    setShowInventoryItemForm(false)
    setSelectedInventoryItem(null)
    fetchVehicleInventoryData()
  }

  const toggleUnitExpansion = (unitId: string) => {
    const newExpanded = new Set(expandedUnits)
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId)
    } else {
      newExpanded.add(unitId)
    }
    setExpandedUnits(newExpanded)
  }

  const getUnitTypeIcon = (unitType: string) => {
    switch (unitType) {
      case "bag":
        return <ShoppingBag className="h-4 w-4" />
      case "cabinet":
        return <Archive className="h-4 w-4" />
      case "kit":
        return <Briefcase className="h-4 w-4" />
      case "compartment":
        return <Box className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getComplianceStatus = (item: VehicleInventoryItem) => {
    if (item.current_quantity < item.par_level_min) {
      return { status: "below_par", color: "destructive", text: "Below Par" }
    }
    if (item.par_level_max && item.current_quantity > item.par_level_max) {
      return { status: "above_par", color: "default", text: "Above Par" }
    }
    return { status: "compliant", color: "secondary", text: "Compliant" }
  }

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Vehicle Selection */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Select Vehicle
          </CardTitle>
          <CardDescription>Choose a vehicle to manage its inventory and storage configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
            <Select
              value={selectedVehicle?.id || ""}
              onValueChange={(value) => {
                const vehicle = vehicles.find((v) => v.id === value)
                setSelectedVehicle(vehicle || null)
              }}
            >
              <SelectTrigger className="w-64 rounded-2xl">
                <SelectValue placeholder="Select vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {filteredVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.year} {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <div className="space-y-6">
          {/* Vehicle Info Header */}
          <Card className="apple-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedVehicle.vehicle_number}</CardTitle>
                  <CardDescription>
                    {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowStorageUnitForm(true)} className="apple-button-secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Storage Unit
                  </Button>
                  <Button onClick={() => setShowInventoryItemForm(true)} className="apple-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Inventory Item
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Storage Units Hierarchy */}
              {storageUnits.map((unit) => (
                <Card key={unit.id} className="apple-card">
                  <Collapsible open={expandedUnits.has(unit.id)} onOpenChange={() => toggleUnitExpansion(unit.id)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedUnits.has(unit.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {getUnitTypeIcon(unit.unit_type)}
                            <div>
                              <CardTitle className="text-lg">{unit.name}</CardTitle>
                              <CardDescription>
                                {unit.unit_type.charAt(0).toUpperCase() + unit.unit_type.slice(1)}
                                {unit.description && ` • ${unit.description}`}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-lg">
                              {unit.storage_locations?.length || 0} locations
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedStorageUnit(unit)
                                setShowStorageUnitForm(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Add Location Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStorageUnit(unit)
                              setShowStorageLocationForm(true)
                            }}
                            className="w-full rounded-xl bg-transparent"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Add Storage Location
                          </Button>

                          {/* Storage Locations */}
                          {unit.storage_locations?.map((location) => {
                            const locationInventory = inventoryItems.filter(
                              (item) => item.storage_location_id === location.id,
                            )

                            return (
                              <div key={location.id} className="border rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <h4 className="font-medium">{location.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {location.location_type.charAt(0).toUpperCase() +
                                          location.location_type.slice(1)}
                                        {location.access_notes && ` • ${location.access_notes}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-lg">
                                      {locationInventory.length} items
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedStorageLocation(location)
                                        setShowStorageLocationForm(true)
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Inventory Items in this Location */}
                                {locationInventory.length > 0 && (
                                  <div className="space-y-2 pl-6">
                                    {locationInventory.map((item) => {
                                      const compliance = getComplianceStatus(item)
                                      return (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Package className="h-3 w-3 text-muted-foreground" />
                                            <div>
                                              <p className="text-sm font-medium">{item.inventory_item?.name}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {item.current_quantity} / {item.par_level_min} min{" "}
                                                {item.inventory_item?.unit_of_measure}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant={compliance.color as any} className="text-xs rounded-lg">
                                              {compliance.text}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setSelectedInventoryItem(item)
                                                setShowInventoryItemForm(true)
                                              }}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}

              {storageUnits.length === 0 && (
                <Card className="apple-card">
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Storage Units Configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding storage units like bags, cabinets, or kits to organize inventory in this vehicle.
                    </p>
                    <Button onClick={() => setShowStorageUnitForm(true)} className="apple-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Storage Unit
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Storage Unit Form Dialog */}
      <Dialog open={showStorageUnitForm} onOpenChange={setShowStorageUnitForm}>
        <DialogContent className="max-w-2xl">
          <VehicleStorageUnitForm
            vehicleId={selectedVehicle?.id}
            storageUnit={selectedStorageUnit}
            onSave={handleStorageUnitSave}
            onCancel={() => {
              setShowStorageUnitForm(false)
              setSelectedStorageUnit(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Storage Location Form Dialog */}
      <Dialog open={showStorageLocationForm} onOpenChange={setShowStorageLocationForm}>
        <DialogContent className="max-w-2xl">
          <VehicleStorageLocationForm
            storageUnit={selectedStorageUnit}
            storageLocation={selectedStorageLocation}
            onSave={handleStorageLocationSave}
            onCancel={() => {
              setShowStorageLocationForm(false)
              setSelectedStorageLocation(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Inventory Item Form Dialog */}
      <Dialog open={showInventoryItemForm} onOpenChange={setShowInventoryItemForm}>
        <DialogContent className="max-w-3xl">
          <VehicleInventoryItemForm
            vehicleId={selectedVehicle?.id}
            storageUnits={storageUnits}
            inventoryItem={selectedInventoryItem}
            onSave={handleInventoryItemSave}
            onCancel={() => {
              setShowInventoryItemForm(false)
              setSelectedInventoryItem(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
