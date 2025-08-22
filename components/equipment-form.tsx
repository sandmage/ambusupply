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

interface EquipmentType {
  id: string
  name: string
  category: string
  manufacturer?: string
  model?: string
}

interface Location {
  id: string
  name: string
}

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
}

interface EquipmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (equipmentData: any) => Promise<void>
  equipmentTypes: EquipmentType[]
  locations: Location[]
  vehicles: Vehicle[]
  editingEquipment?: any
}

const STATUS_OPTIONS = [
  { value: "in_service", label: "In Service" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "maintenance", label: "Maintenance" },
  { value: "assigned", label: "Assigned" },
  { value: "retired", label: "Retired" },
]

export function EquipmentForm({
  isOpen,
  onClose,
  onSave,
  equipmentTypes,
  locations,
  vehicles,
  editingEquipment,
}: EquipmentFormProps) {
  const [formData, setFormData] = useState({
    equipment_type_id: editingEquipment?.equipment_type_id || "",
    serial_number: editingEquipment?.serial_number || "",
    asset_tag: editingEquipment?.asset_tag || "",
    status: editingEquipment?.status || "in_service",
    purchase_date: editingEquipment?.purchase_date || "",
    purchase_cost: editingEquipment?.purchase_cost || "",
    warranty_expiration: editingEquipment?.warranty_expiration || "",
    location_id: editingEquipment?.location_id || "",
    assigned_vehicle_id: editingEquipment?.assigned_vehicle_id || "",
    notes: editingEquipment?.notes || "",
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
      if (!formData.equipment_type_id || !formData.serial_number) {
        setError("Please fill in all required fields")
        return
      }

      const equipmentData = {
        equipment_type_id: formData.equipment_type_id,
        serial_number: formData.serial_number,
        asset_tag: formData.asset_tag || null,
        status: formData.status,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost ? Number.parseFloat(formData.purchase_cost) : null,
        warranty_expiration: formData.warranty_expiration || null,
        location_id: formData.location_id || null,
        assigned_vehicle_id: formData.assigned_vehicle_id || null,
        notes: formData.notes || null,
        ...(editingEquipment && { id: editingEquipment.id }),
      }

      await onSave(equipmentData)
      onClose()
      resetForm()
    } catch (error) {
      setError("Failed to save equipment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      equipment_type_id: "",
      serial_number: "",
      asset_tag: "",
      status: "in_service",
      purchase_date: "",
      purchase_cost: "",
      warranty_expiration: "",
      location_id: "",
      assigned_vehicle_id: "",
      notes: "",
    })
  }

  const handleClose = () => {
    onClose()
    if (!editingEquipment) {
      resetForm()
    }
  }

  const selectedEquipmentType = equipmentTypes.find((type) => type.id === formData.equipment_type_id)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
          <DialogDescription>
            {editingEquipment
              ? "Update equipment information and status"
              : "Add new medical equipment to the inventory system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Equipment Type */}
            <div className="grid gap-2">
              <Label htmlFor="equipment_type">Equipment Type *</Label>
              <Select
                value={formData.equipment_type_id}
                onValueChange={(value) => handleInputChange("equipment_type_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} - {type.category}
                      {type.manufacturer && ` (${type.manufacturer})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serial Number and Asset Tag */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serial_number">Serial Number *</Label>
                <Input
                  id="serial_number"
                  placeholder="Enter serial number"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange("serial_number", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="asset_tag">Asset Tag</Label>
                <Input
                  id="asset_tag"
                  placeholder="Enter asset tag (optional)"
                  value={formData.asset_tag}
                  onChange={(e) => handleInputChange("asset_tag", e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchase_cost">Purchase Cost</Label>
                <Input
                  id="purchase_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.purchase_cost}
                  onChange={(e) => handleInputChange("purchase_cost", e.target.value)}
                />
              </div>
            </div>

            {/* Warranty Expiration */}
            <div className="grid gap-2">
              <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
              <Input
                id="warranty_expiration"
                type="date"
                value={formData.warranty_expiration}
                onChange={(e) => handleInputChange("warranty_expiration", e.target.value)}
              />
            </div>

            {/* Location Assignment */}
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location_id || "none"}
                onValueChange={(value) => handleInputChange("location_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Assignment */}
            <div className="grid gap-2">
              <Label htmlFor="vehicle">Assigned Vehicle</Label>
              <Select
                value={formData.assigned_vehicle_id || "none"}
                onValueChange={(value) => handleInputChange("assigned_vehicle_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vehicle assignment</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this equipment..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.equipment_type_id.trim() || !formData.serial_number.trim()}
            >
              {isLoading ? "Saving..." : editingEquipment ? "Update Equipment" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
