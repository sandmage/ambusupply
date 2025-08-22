"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Search } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  description?: string
  category?: string
  unit_of_measure: string
}

interface VehicleStorageUnit {
  id: string
  name: string
  unit_type: string
  storage_locations?: VehicleStorageLocation[]
}

interface VehicleStorageLocation {
  id: string
  storage_unit_id: string
  name: string
  location_type: string
}

interface VehicleInventoryItem {
  id?: string
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
}

interface VehicleInventoryItemFormProps {
  vehicleId?: string
  storageUnits: VehicleStorageUnit[]
  inventoryItem?: VehicleInventoryItem | null
  onSave: () => void
  onCancel: () => void
}

export function VehicleInventoryItemForm({
  vehicleId,
  storageUnits,
  inventoryItem,
  onSave,
  onCancel,
}: VehicleInventoryItemFormProps) {
  const [formData, setFormData] = useState({
    inventory_item_id: "",
    storage_unit_id: "",
    storage_location_id: "",
    current_quantity: 0,
    par_level_min: 1,
    par_level_max: "",
    expiration_date: "",
    lot_number: "",
    notes: "",
  })
  const [availableInventoryItems, setAvailableInventoryItems] = useState<InventoryItem[]>([])
  const [availableLocations, setAvailableLocations] = useState<VehicleStorageLocation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchInventoryItems()
  }, [])

  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        inventory_item_id: inventoryItem.inventory_item_id || "",
        storage_unit_id: inventoryItem.storage_unit_id || "",
        storage_location_id: inventoryItem.storage_location_id || "",
        current_quantity: inventoryItem.current_quantity || 0,
        par_level_min: inventoryItem.par_level_min || 1,
        par_level_max: inventoryItem.par_level_max?.toString() || "",
        expiration_date: inventoryItem.expiration_date || "",
        lot_number: inventoryItem.lot_number || "",
        notes: inventoryItem.notes || "",
      })
    }
  }, [inventoryItem])

  useEffect(() => {
    if (formData.storage_unit_id) {
      const selectedUnit = storageUnits.find((unit) => unit.id === formData.storage_unit_id)
      setAvailableLocations(selectedUnit?.storage_locations || [])
      // Clear location selection if unit changes
      if (formData.storage_location_id) {
        const locationExists = selectedUnit?.storage_locations?.some((loc) => loc.id === formData.storage_location_id)
        if (!locationExists) {
          setFormData((prev) => ({ ...prev, storage_location_id: "" }))
        }
      }
    } else {
      setAvailableLocations([])
    }
  }, [formData.storage_unit_id, storageUnits])

  const fetchInventoryItems = async () => {
    try {
      const { data } = await supabase
        .from("inventory_items")
        .select("id, name, description, category, unit_of_measure")
        .order("name")

      setAvailableInventoryItems(data || [])
    } catch (error) {
      console.error("Error fetching inventory items:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !formData.inventory_item_id) {
      setError("Please select an inventory item")
      return
    }

    if (!formData.storage_unit_id && !formData.storage_location_id) {
      setError("Please select either a storage unit or specific location")
      return
    }

    setLoading(true)
    setError("")

    try {
      const itemData = {
        vehicle_id: vehicleId,
        inventory_item_id: formData.inventory_item_id,
        storage_unit_id: formData.storage_location_id ? null : formData.storage_unit_id || null,
        storage_location_id: formData.storage_location_id || null,
        current_quantity: Number.parseInt(formData.current_quantity.toString()),
        par_level_min: Number.parseInt(formData.par_level_min.toString()),
        par_level_max: formData.par_level_max ? Number.parseInt(formData.par_level_max) : null,
        expiration_date: formData.expiration_date || null,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
      }

      if (inventoryItem?.id) {
        // Update existing inventory item
        const { error } = await supabase.from("vehicle_inventory_items").update(itemData).eq("id", inventoryItem.id)

        if (error) throw error
      } else {
        // Create new inventory item
        const { error } = await supabase.from("vehicle_inventory_items").insert([itemData])

        if (error) throw error
      }

      onSave()
    } catch (error: any) {
      console.error("Error saving vehicle inventory item:", error)
      setError(error.message || "Failed to save inventory item")
    } finally {
      setLoading(false)
    }
  }

  const filteredInventoryItems = availableInventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const selectedInventoryItem = availableInventoryItems.find((item) => item.id === formData.inventory_item_id)

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{inventoryItem ? "Edit Vehicle Inventory Item" : "Add Vehicle Inventory Item"}</DialogTitle>
        <DialogDescription>
          {inventoryItem
            ? "Update the inventory item assignment and par levels"
            : "Assign an inventory item to a specific location within the vehicle"}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Inventory Item Selection */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4">Select Inventory Item</h4>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={formData.inventory_item_id}
                onValueChange={(value) => setFormData({ ...formData, inventory_item_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory item" />
                </SelectTrigger>
                <SelectContent>
                  {filteredInventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        {item.description && <span className="text-sm text-muted-foreground">{item.description}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedInventoryItem && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">
                    <strong>Category:</strong> {selectedInventoryItem.category || "N/A"} • <strong>Unit:</strong>{" "}
                    {selectedInventoryItem.unit_of_measure}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Location Selection */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4">Storage Location</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storage_unit_id">Storage Unit</Label>
                <Select
                  value={formData.storage_unit_id}
                  onValueChange={(value) => setFormData({ ...formData, storage_unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.unit_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_location_id">Specific Location (Optional)</Label>
                <Select
                  value={formData.storage_location_id}
                  onValueChange={(value) => setFormData({ ...formData, storage_location_id: value })}
                  disabled={!formData.storage_unit_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific location" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.location_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity and Par Levels */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4">Quantity & Par Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_quantity">Current Quantity</Label>
                <Input
                  id="current_quantity"
                  type="number"
                  value={formData.current_quantity}
                  onChange={(e) => setFormData({ ...formData, current_quantity: Number.parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="par_level_min">Minimum Par Level *</Label>
                <Input
                  id="par_level_min"
                  type="number"
                  value={formData.par_level_min}
                  onChange={(e) => setFormData({ ...formData, par_level_min: Number.parseInt(e.target.value) || 1 })}
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="par_level_max">Maximum Par Level</Label>
                <Input
                  id="par_level_max"
                  type="number"
                  value={formData.par_level_max}
                  onChange={(e) => setFormData({ ...formData, par_level_max: e.target.value })}
                  min="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4">Additional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lot_number">Lot Number</Label>
                <Input
                  id="lot_number"
                  value={formData.lot_number}
                  onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
                  placeholder="Batch/lot number"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this inventory assignment"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="apple-button">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {inventoryItem ? "Update Assignment" : "Create Assignment"}
          </Button>
        </div>
      </form>
    </div>
  )
}
