"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { InventoryItem, Location } from "@/lib/types"

interface InventoryFormProps {
  item?: InventoryItem
  locations: Location[]
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<InventoryItem, "id" | "created_at" | "location_name">) => Promise<void>
  userRole?: string
}

const UNIT_OPTIONS = [
  "each",
  "box",
  "bottle",
  "vial",
  "tube",
  "pack",
  "roll",
  "sheet",
  "bag",
  "kit",
  "set",
  "pair",
  "dose",
  "ml",
  "mg",
  "g",
  "kg",
]

export function InventoryForm({ item, locations, isOpen, onClose, onSave, userRole }: InventoryFormProps) {
  const [name, setName] = useState(item?.name || "")
  const [description, setDescription] = useState(item?.description || "")
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || "0")
  const [minParLevel, setMinParLevel] = useState(item?.min_par_level?.toString() || "0")
  const [unitOfMeasure, setUnitOfMeasure] = useState(item?.unit_of_measure || "each")
  const [expirationDate, setExpirationDate] = useState(item?.expiration_date || "")
  const [notes, setNotes] = useState(item?.notes || "")
  const [locationId, setLocationId] = useState(item?.location_id || "")
  const [storageUnitId, setStorageUnitId] = useState(item?.storage_unit_id || "")
  const [orderingUrl, setOrderingUrl] = useState(item?.ordering_url || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedLocation = locations.find((loc) => loc.id === locationId)
  const availableStorageUnits = selectedLocation?.storage_units || []
  const isAdmin = userRole === "admin"

  useEffect(() => {
    if (locationId !== item?.location_id) {
      setStorageUnitId("")
    }
  }, [locationId, item?.location_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        quantity: Number.parseInt(quantity) || 0,
        min_par_level: Number.parseInt(minParLevel) || 0,
        unit_of_measure: unitOfMeasure,
        expiration_date: expirationDate || undefined,
        notes: notes.trim() || undefined,
        location_id: locationId,
        storage_unit_id: storageUnitId || undefined,
        ordering_url: orderingUrl.trim() || undefined,
      })
      onClose()
      resetForm()
    } catch (error) {
      setError("Failed to save inventory item. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName(item?.name || "")
    setDescription(item?.description || "")
    setQuantity(item?.quantity?.toString() || "0")
    setMinParLevel(item?.min_par_level?.toString() || "0")
    setUnitOfMeasure(item?.unit_of_measure || "each")
    setExpirationDate(item?.expiration_date || "")
    setNotes(item?.notes || "")
    setLocationId(item?.location_id || "")
    setStorageUnitId(item?.storage_unit_id || "")
    setOrderingUrl(item?.ordering_url || "")
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the inventory item details." : "Create a new inventory item."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="e.g., Bandages, Oxygen Tank, Saline Solution"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Current Stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minParLevel">Minimum Par Level</Label>
                <Input
                  id="minParLevel"
                  type="number"
                  min="0"
                  value={minParLevel}
                  onChange={(e) => setMinParLevel(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
              <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expirationDate">Expiration Date (Optional)</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select value={locationId} onValueChange={setLocationId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableStorageUnits.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="storageUnit">Storage Unit (Optional)</Label>
                <Select value={storageUnitId || "none"} onValueChange={setStorageUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a storage unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific storage unit</SelectItem>
                    {availableStorageUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Supplier info, reorder details, special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {isAdmin && (
              <div className="grid gap-2">
                <Label htmlFor="orderingUrl">Ordering URL (Admin Only)</Label>
                <Input
                  id="orderingUrl"
                  type="url"
                  placeholder="https://supplier.com/product-page"
                  value={orderingUrl}
                  onChange={(e) => setOrderingUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add a direct link to reorder this item from your supplier
                </p>
              </div>
            )}
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !locationId}>
              {isLoading ? "Saving..." : item ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
