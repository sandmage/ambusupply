"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
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

interface AssignmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (assignmentData: any) => Promise<void>
  equipment: Equipment[]
  locations: Location[]
  vehicles: Vehicle[]
  selectedEquipmentId?: string
  editingAssignment?: any
}

export function EquipmentAssignmentForm({
  isOpen,
  onClose,
  onSave,
  equipment,
  locations,
  vehicles,
  selectedEquipmentId,
  editingAssignment,
}: AssignmentFormProps) {
  const [formData, setFormData] = useState({
    equipment_id: selectedEquipmentId || editingAssignment?.equipment_id || "",
    assignment_type: editingAssignment?.assignment_type || "vehicle",
    vehicle_id: editingAssignment?.vehicle_id || "",
    location_id: editingAssignment?.location_id || "",
    assignment_notes: editingAssignment?.assignment_notes || "",
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
      if (!formData.equipment_id) {
        setError("Please select equipment")
        return
      }

      if (formData.assignment_type === "vehicle" && !formData.vehicle_id) {
        setError("Please select a vehicle")
        return
      }

      if (formData.assignment_type === "location" && !formData.location_id) {
        setError("Please select a location")
        return
      }

      const assignmentData = {
        equipment_id: formData.equipment_id,
        vehicle_id: formData.assignment_type === "vehicle" ? formData.vehicle_id : null,
        location_id: formData.assignment_type === "location" ? formData.location_id : null,
        assignment_notes: formData.assignment_notes || null,
      }

      if (editingAssignment) {
        assignmentData.id = editingAssignment.id
      }

      await onSave(assignmentData)
      onClose()
      resetForm()
    } catch (error) {
      setError("Failed to save assignment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      equipment_id: selectedEquipmentId || "",
      assignment_type: "vehicle",
      vehicle_id: "",
      location_id: "",
      assignment_notes: "",
    })
  }

  const handleClose = () => {
    onClose()
    if (!editingAssignment) {
      resetForm()
    }
  }

  const selectedEquipment = equipment.find((eq) => eq.id === formData.equipment_id)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAssignment ? "Update Assignment" : "Assign Equipment"}</DialogTitle>
          <DialogDescription>
            {editingAssignment ? "Update equipment assignment details" : "Assign equipment to a vehicle or location"}
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

            {/* Assignment Type */}
            <div className="grid gap-2">
              <Label htmlFor="assignment_type">Assignment Type *</Label>
              <Select
                value={formData.assignment_type}
                onValueChange={(value) => {
                  handleInputChange("assignment_type", value)
                  // Clear the other assignment field when switching types
                  if (value === "vehicle") {
                    handleInputChange("location_id", "")
                  } else {
                    handleInputChange("vehicle_id", "")
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Assign to Vehicle</SelectItem>
                  <SelectItem value="location">Assign to Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Selection */}
            {formData.assignment_type === "vehicle" && (
              <div className="grid gap-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => handleInputChange("vehicle_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location Selection */}
            {formData.assignment_type === "location" && (
              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => handleInputChange("location_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
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
            )}

            {/* Assignment Notes */}
            <div className="grid gap-2">
              <Label htmlFor="assignment_notes">Assignment Notes</Label>
              <Textarea
                id="assignment_notes"
                placeholder="Additional notes about this assignment..."
                value={formData.assignment_notes}
                onChange={(e) => handleInputChange("assignment_notes", e.target.value)}
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
              disabled={
                isLoading ||
                !formData.equipment_id ||
                (formData.assignment_type === "vehicle" && !formData.vehicle_id) ||
                (formData.assignment_type === "location" && !formData.location_id)
              }
            >
              {isLoading ? "Saving..." : editingAssignment ? "Update Assignment" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
