"use client"

import type React from "react"
import { useState } from "react"
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
import type { Location } from "@/lib/types"

interface MedicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (medicationData: any) => Promise<void>
  locations: Location[]
}

const UNIT_OPTIONS = ["units", "tablets", "capsules", "vials", "bottles", "boxes", "ml", "mg", "g", "doses"]

export function MedicationForm({ isOpen, onClose, onSave, locations }: MedicationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lot_number: "",
    quantity: "",
    unit_of_measure: "units",
    expiration_date: "",
    location_id: "",
    storage_unit_id: "",
    min_par_level: "",
    max_par_level: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Basic validation
      if (!formData.name || !formData.quantity || !formData.location_id) {
        setError("Please fill in all required fields")
        return
      }

      await onSave({
        name: formData.name,
        description: formData.description || null,
        quantity: Number.parseInt(formData.quantity),
        unit_of_measure: formData.unit_of_measure,
        expiration_date: formData.expiration_date || null,
        lot_number: formData.lot_number || null,
        location_id: formData.location_id,
        storage_unit_id: formData.storage_unit_id || null,
        par_level: Number.parseInt(formData.min_par_level) || 0,
        notes: null,
      })

      onClose()
      resetForm()
    } catch (error) {
      setError("Failed to save medication. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      lot_number: "",
      quantity: "",
      unit_of_measure: "units",
      expiration_date: "",
      location_id: "",
      storage_unit_id: "",
      min_par_level: "",
      max_par_level: "",
    })
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const selectedLocation = locations.find((loc) => loc.id === formData.location_id)
  const availableStorageUnits = selectedLocation?.storage_units || []

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Medication</DialogTitle>
          <DialogDescription>Add a new medication to the inventory system with expiration tracking.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid gap-2">
              <Label htmlFor="name">Medication Name</Label>
              <Input
                id="name"
                placeholder="e.g., Albuterol, Epinephrine, Aspirin"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this medication..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lot_number">Lot Number</Label>
              <Input
                id="lot_number"
                placeholder="Enter lot number (optional)"
                value={formData.lot_number}
                onChange={(e) => handleInputChange("lot_number", e.target.value)}
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Select
                  value={formData.unit_of_measure}
                  onValueChange={(value) => handleInputChange("unit_of_measure", value)}
                >
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
            </div>

            {/* Location */}
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => handleInputChange("location_id", value)}
                required
              >
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

            {/* Storage Unit */}
            {availableStorageUnits.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="storage_unit">Storage Unit (Optional)</Label>
                <Select
                  value={formData.storage_unit_id || "none"}
                  onValueChange={(value) => handleInputChange("storage_unit_id", value === "none" ? "" : value)}
                >
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

            {/* Expiration Date */}
            <div className="grid gap-2">
              <Label htmlFor="expiration_date">Expiration Date (Optional)</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => handleInputChange("expiration_date", e.target.value)}
              />
            </div>

            {/* Par Levels */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_par_level">Minimum Par Level</Label>
                <Input
                  id="min_par_level"
                  type="number"
                  min="0"
                  value={formData.min_par_level}
                  onChange={(e) => handleInputChange("min_par_level", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_par_level">Maximum Par Level</Label>
                <Input
                  id="max_par_level"
                  type="number"
                  min="0"
                  value={formData.max_par_level}
                  onChange={(e) => handleInputChange("max_par_level", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim() || !formData.location_id}>
              {isLoading ? "Adding..." : "Add Medication"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
