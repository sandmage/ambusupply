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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

interface VehicleStorageUnit {
  id?: string
  vehicle_id: string
  name: string
  unit_type: string
  description?: string
  position_info?: any
  is_removable: boolean
}

interface VehicleStorageUnitFormProps {
  vehicleId?: string
  storageUnit?: VehicleStorageUnit | null
  onSave: () => void
  onCancel: () => void
}

export function VehicleStorageUnitForm({ vehicleId, storageUnit, onSave, onCancel }: VehicleStorageUnitFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    unit_type: "",
    description: "",
    position_side: "",
    position_level: "",
    position_bay: "",
    is_removable: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (storageUnit) {
      setFormData({
        name: storageUnit.name || "",
        unit_type: storageUnit.unit_type || "",
        description: storageUnit.description || "",
        position_side: storageUnit.position_info?.side || "",
        position_level: storageUnit.position_info?.level || "",
        position_bay: storageUnit.position_info?.bay || "",
        is_removable: storageUnit.is_removable || false,
      })
    }
  }, [storageUnit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !formData.name || !formData.unit_type) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      const position_info = {
        side: formData.position_side || null,
        level: formData.position_level || null,
        bay: formData.position_bay || null,
      }

      const unitData = {
        vehicle_id: vehicleId,
        name: formData.name,
        unit_type: formData.unit_type,
        description: formData.description || null,
        position_info,
        is_removable: formData.is_removable,
      }

      if (storageUnit?.id) {
        // Update existing storage unit
        const { error } = await supabase.from("vehicle_storage_units").update(unitData).eq("id", storageUnit.id)

        if (error) throw error
      } else {
        // Create new storage unit
        const { error } = await supabase.from("vehicle_storage_units").insert([unitData])

        if (error) throw error
      }

      onSave()
    } catch (error: any) {
      console.error("Error saving storage unit:", error)
      setError(error.message || "Failed to save storage unit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{storageUnit ? "Edit Storage Unit" : "Add Storage Unit"}</DialogTitle>
        <DialogDescription>
          {storageUnit
            ? "Update the storage unit configuration"
            : "Create a new storage unit for organizing inventory within the vehicle"}
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
            <Label htmlFor="name">Storage Unit Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., ALS Bag, Cabinet 1, Trauma Kit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_type">Unit Type *</Label>
            <Select
              value={formData.unit_type}
              onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bag">Bag</SelectItem>
                <SelectItem value="cabinet">Cabinet</SelectItem>
                <SelectItem value="kit">Kit</SelectItem>
                <SelectItem value="compartment">Compartment</SelectItem>
                <SelectItem value="drawer">Drawer</SelectItem>
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
            placeholder="Brief description of the storage unit and its purpose"
            rows={2}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-4">Position Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position_side">Side</Label>
                <Select
                  value={formData.position_side}
                  onValueChange={(value) => setFormData({ ...formData, position_side: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="rear">Rear</SelectItem>
                    <SelectItem value="front">Front</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_level">Level</Label>
                <Select
                  value={formData.position_level}
                  onValueChange={(value) => setFormData({ ...formData, position_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upper">Upper</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="lower">Lower</SelectItem>
                    <SelectItem value="floor">Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_bay">Bay/Area</Label>
                <Select
                  value={formData.position_bay}
                  onValueChange={(value) => setFormData({ ...formData, position_bay: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient_compartment">Patient Compartment</SelectItem>
                    <SelectItem value="main_compartment">Main Compartment</SelectItem>
                    <SelectItem value="driver_compartment">Driver Compartment</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_removable"
            checked={formData.is_removable}
            onCheckedChange={(checked) => setFormData({ ...formData, is_removable: checked })}
          />
          <Label htmlFor="is_removable">Removable Unit</Label>
          <span className="text-sm text-muted-foreground">(Can this unit be removed from the vehicle?)</span>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="apple-button">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {storageUnit ? "Update Unit" : "Create Unit"}
          </Button>
        </div>
      </form>
    </div>
  )
}
