"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Save, X } from "lucide-react"

interface Vehicle {
  id?: string
  vehicle_number: string
  make: string
  model: string
  year: number
  vin: string
  license_plate: string
  vehicle_type: string
  status: string
  mileage: number
  fuel_capacity: number
}

interface VehicleFormProps {
  vehicle?: Vehicle
  onSave: (vehicle: Vehicle) => void
  onCancel: () => void
}

export function VehicleForm({ vehicle, onSave, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState<Vehicle>({
    vehicle_number: vehicle?.vehicle_number || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    vin: vehicle?.vin || "",
    license_plate: vehicle?.license_plate || "",
    vehicle_type: vehicle?.vehicle_type || "ambulance",
    status: vehicle?.status || "active",
    mileage: vehicle?.mileage || 0,
    fuel_capacity: vehicle?.fuel_capacity || 0,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createClient()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vehicle_number.trim()) newErrors.vehicle_number = "Vehicle number is required"
    if (!formData.make.trim()) newErrors.make = "Make is required"
    if (!formData.model.trim()) newErrors.model = "Model is required"
    if (!formData.vin.trim()) newErrors.vin = "VIN is required"
    if (!formData.license_plate.trim()) newErrors.license_plate = "License plate is required"
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = "Please enter a valid year"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      if (vehicle?.id) {
        // Update existing vehicle
        const { error } = await supabase
          .from("vehicles")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vehicle.id)

        if (error) throw error
      } else {
        // Create new vehicle
        const { error } = await supabase.from("vehicles").insert([formData])

        if (error) throw error
      }

      onSave(formData)
    } catch (error: any) {
      console.error("Error saving vehicle:", error)
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.message.includes("vehicle_number")) {
          setErrors({ vehicle_number: "Vehicle number already exists" })
        } else if (error.message.includes("vin")) {
          setErrors({ vin: "VIN already exists" })
        } else if (error.message.includes("license_plate")) {
          setErrors({ license_plate: "License plate already exists" })
        }
      } else {
        setErrors({ general: "Failed to save vehicle. Please try again." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Vehicle, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card className="apple-card max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</CardTitle>
        <CardDescription>
          {vehicle ? "Update vehicle information" : "Enter details for the new vehicle"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle_number">Vehicle Number *</Label>
              <Input
                id="vehicle_number"
                value={formData.vehicle_number}
                onChange={(e) => handleInputChange("vehicle_number", e.target.value)}
                placeholder="AMB-001"
                className="rounded-xl"
              />
              {errors.vehicle_number && <p className="text-sm text-destructive">{errors.vehicle_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type</Label>
              <Select value={formData.vehicle_type} onValueChange={(value) => handleInputChange("vehicle_type", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulance">Ambulance</SelectItem>
                  <SelectItem value="support_vehicle">Support Vehicle</SelectItem>
                  <SelectItem value="supervisor_vehicle">Supervisor Vehicle</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange("make", e.target.value)}
                placeholder="Ford"
                className="rounded-xl"
              />
              {errors.make && <p className="text-sm text-destructive">{errors.make}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="Transit"
                className="rounded-xl"
              />
              {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", Number.parseInt(e.target.value) || 0)}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="rounded-xl"
              />
              {errors.year && <p className="text-sm text-destructive">{errors.year}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleInputChange("vin", e.target.value.toUpperCase())}
                placeholder="1HGBH41JXMN109186"
                maxLength={17}
                className="rounded-xl font-mono"
              />
              {errors.vin && <p className="text-sm text-destructive">{errors.vin}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_plate">License Plate *</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => handleInputChange("license_plate", e.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="rounded-xl font-mono"
              />
              {errors.license_plate && <p className="text-sm text-destructive">{errors.license_plate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage">Current Mileage</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => handleInputChange("mileage", Number.parseInt(e.target.value) || 0)}
                min="0"
                placeholder="0"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel_capacity">Fuel Capacity (gallons)</Label>
              <Input
                id="fuel_capacity"
                type="number"
                step="0.1"
                value={formData.fuel_capacity}
                onChange={(e) => handleInputChange("fuel_capacity", Number.parseFloat(e.target.value) || 0)}
                min="0"
                placeholder="25.0"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={loading} className="apple-button flex-1">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {vehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-2xl bg-transparent">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
