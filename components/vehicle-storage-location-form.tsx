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
import { Loader2, AlertCircle } from "lucide-react"

interface VehicleStorageUnit {
  id: string
  name: string
  unit_type: string
}

interface VehicleStorageLocation {
  id?: string
  storage_unit_id: string
  name: string
  location_type: string
  description?: string
  position_info?: any
  access_notes?: string
}

interface VehicleStorageLocationFormProps {
  storageUnit?: VehicleStorageUnit | null
  storageLocation?: VehicleStorageLocation | null
  onSave: () => void
  onCancel: () => void
}

export function VehicleStorageLocationForm({
  storageUnit,
  storageLocation,
  onSave,
  onCancel,
}: VehicleStorageLocationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    location_type: "",
    description: "",
    access_notes: "",
    position_row: "",
    position_column: "",
    position_depth: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (storageLocation) {
      setFormData({
        name: storageLocation.name || "",
        location_type: storageLocation.location_type || "",
        description: storageLocation.description || "",
        access_notes: storageLocation.access_notes || "",
        position_row: storageLocation.position_info?.row?.toString() || "",
        position_column: storageLocation.position_info?.column?.toString() || "",
        position_depth: storageLocation.position_info?.depth || "",
      })
    }
  }, [storageLocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storageUnit?.id || !formData.name || !formData.location_type) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      const position_info = {
        row: formData.position_row ? Number.parseInt(formData.position_row) : null,
        column: formData.position_column ? Number.parseInt(formData.position_column) : null,
        depth: formData.position_depth || null,
      }

      const locationData = {
        storage_unit_id: storageUnit.id,
        name: formData.name,
        location_type: formData.location_type,
        description: formData.description || null,
        position_info,
        access_notes: formData.access_notes || null,
      }

      if (storageLocation?.id) {
        // Update existing storage location
        const { error } = await supabase
          .from("vehicle_storage_locations")
          .update(locationData)
          .eq("id", storageLocation.id)

        if (error) throw error
      } else {
        // Create new storage location
        const { error } = await supabase.from("vehicle_storage_locations").insert([locationData])

        if (error) throw error
      }

      onSave()
    } catch (error: any) {
      console.error("Error saving storage location:", error)
      setError(error.message || "Failed to save storage location")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{storageLocation ? "Edit Storage Location" : "Add Storage Location"}</DialogTitle>
        <DialogDescription>
          {storageLocation
            ? "Update the storage location within the unit"
            : `Create a new storage location within ${storageUnit?.name || "the storage unit"}`}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Front Flap Pocket, Shelf B, Module 2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_type">Location Type *</Label>
            <Select
              value={formData.location_type}
              onValueChange={(value) => setFormData({ ...formData, location_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pocket">Pocket</SelectItem>
                <SelectItem value="pouch">Pouch</SelectItem>
                <SelectItem value="shelf">Shelf</SelectItem>
                <SelectItem value="module">Module</SelectItem>
                <SelectItem value="compartment">Compartment</SelectItem>
                <SelectItem value="slot">Slot</SelectItem>
                <SelectItem value="hook">Hook</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this storage location"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="access_notes">Access Notes</Label>
          <Input
            id="access_notes"
            value={formData.access_notes}
            onChange={(e) => setFormData({ ...formData, access_notes: e.target.value })}
            placeholder="e.g., Velcro closure, Zipper pocket, Magnetic latch"
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4">Position Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position_row">Row</Label>
                <Input
                  id="position_row"
                  type="number"
                  value={formData.position_row}
                  onChange={(e) => setFormData({ ...formData, position_row: e.target.value })}
                  placeholder="1, 2, 3..."
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_column">Column</Label>
                <Input
                  id="position_column"
                  type="number"
                  value={formData.position_column}
                  onChange={(e) => setFormData({ ...formData, position_column: e.target.value })}
                  placeholder="1, 2, 3..."
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_depth">Depth</Label>
                <Select
                  value={formData.position_depth}
                  onValueChange={(value) => setFormData({ ...formData, position_depth: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">Front</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="apple-button">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {storageLocation ? "Update Location" : "Create Location"}
          </Button>
        </div>
      </form>
    </div>
  )
}
