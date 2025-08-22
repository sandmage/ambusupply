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

interface Equipment {
  id: string
  serial_number: string
  equipment_types: {
    name: string
    manufacturer?: string
    model?: string
  }
}

interface MaintenanceFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (maintenanceData: any) => Promise<void>
  equipment: Equipment[]
  selectedEquipmentId?: string
  editingMaintenance?: any
}

const MAINTENANCE_TYPES = [
  { value: "routine", label: "Routine Maintenance" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "calibration", label: "Calibration" },
  { value: "emergency", label: "Emergency Repair" },
]

export function EquipmentMaintenanceForm({
  isOpen,
  onClose,
  onSave,
  equipment,
  selectedEquipmentId,
  editingMaintenance,
}: MaintenanceFormProps) {
  const [formData, setFormData] = useState({
    equipment_id: selectedEquipmentId || editingMaintenance?.equipment_id || "",
    maintenance_type: editingMaintenance?.maintenance_type || "routine",
    description: editingMaintenance?.description || "",
    scheduled_date: editingMaintenance?.scheduled_date || "",
    completed_date: editingMaintenance?.completed_date || "",
    cost: editingMaintenance?.cost || "",
    service_provider: editingMaintenance?.service_provider || "",
    parts_replaced: editingMaintenance?.parts_replaced || "",
    next_service_due: editingMaintenance?.next_service_due || "",
    maintenance_notes: editingMaintenance?.maintenance_notes || "",
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
      if (!formData.equipment_id || !formData.maintenance_type || !formData.description) {
        setError("Please fill in all required fields")
        return
      }

      const maintenanceData = {
        equipment_id: formData.equipment_id,
        maintenance_type: formData.maintenance_type,
        description: formData.description,
        scheduled_date: formData.scheduled_date || null,
        completed_date: formData.completed_date || null,
        cost: formData.cost ? Number.parseFloat(formData.cost) : null,
        service_provider: formData.service_provider || null,
        parts_replaced: formData.parts_replaced
          ? JSON.parse(
              `["${formData.parts_replaced
                .split(",")
                .map((p) => p.trim())
                .join('","')}"]`,
            )
          : null,
        next_service_due: formData.next_service_due || null,
        maintenance_notes: formData.maintenance_notes || null,
      }

      if (editingMaintenance) {
        maintenanceData.id = editingMaintenance.id
      }

      await onSave(maintenanceData)
      onClose()
      resetForm()
    } catch (error) {
      setError("Failed to save maintenance record. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      equipment_id: selectedEquipmentId || "",
      maintenance_type: "routine",
      description: "",
      scheduled_date: "",
      completed_date: "",
      cost: "",
      service_provider: "",
      parts_replaced: "",
      next_service_due: "",
      maintenance_notes: "",
    })
  }

  const handleClose = () => {
    onClose()
    if (!editingMaintenance) {
      resetForm()
    }
  }

  const selectedEquipment = equipment.find((eq) => eq.id === formData.equipment_id)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMaintenance ? "Edit Maintenance Record" : "Schedule Maintenance"}</DialogTitle>
          <DialogDescription>
            {editingMaintenance ? "Update maintenance record details" : "Schedule or record maintenance for equipment"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Equipment Selection */}
            <div className="grid gap-2">
              <Label htmlFor="equipment">Equipment *</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => handleInputChange("equipment_id", value)}
                required
                disabled={!!selectedEquipmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.equipment_types.name} - {eq.serial_number}
                      {eq.equipment_types.manufacturer && ` (${eq.equipment_types.manufacturer})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Maintenance Type */}
            <div className="grid gap-2">
              <Label htmlFor="maintenance_type">Maintenance Type *</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => handleInputChange("maintenance_type", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance work to be performed..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                required
                rows={3}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => handleInputChange("scheduled_date", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="completed_date">Completed Date</Label>
                <Input
                  id="completed_date"
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => handleInputChange("completed_date", e.target.value)}
                />
              </div>
            </div>

            {/* Cost and Service Provider */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => handleInputChange("cost", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service_provider">Service Provider</Label>
                <Input
                  id="service_provider"
                  placeholder="Company or technician name"
                  value={formData.service_provider}
                  onChange={(e) => handleInputChange("service_provider", e.target.value)}
                />
              </div>
            </div>

            {/* Parts Replaced */}
            <div className="grid gap-2">
              <Label htmlFor="parts_replaced">Parts Replaced</Label>
              <Input
                id="parts_replaced"
                placeholder="List parts separated by commas"
                value={formData.parts_replaced}
                onChange={(e) => handleInputChange("parts_replaced", e.target.value)}
              />
            </div>

            {/* Next Service Due */}
            <div className="grid gap-2">
              <Label htmlFor="next_service_due">Next Service Due</Label>
              <Input
                id="next_service_due"
                type="date"
                value={formData.next_service_due}
                onChange={(e) => handleInputChange("next_service_due", e.target.value)}
              />
            </div>

            {/* Maintenance Notes */}
            <div className="grid gap-2">
              <Label htmlFor="maintenance_notes">Additional Notes</Label>
              <Textarea
                id="maintenance_notes"
                placeholder="Additional notes about the maintenance..."
                value={formData.maintenance_notes}
                onChange={(e) => handleInputChange("maintenance_notes", e.target.value)}
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
              disabled={isLoading || !formData.equipment_id || !formData.maintenance_type || !formData.description}
            >
              {isLoading ? "Saving..." : editingMaintenance ? "Update Record" : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
