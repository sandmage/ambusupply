"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Save, X, Calendar, Shield, Wrench, FileText } from "lucide-react"

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
  registration_expiration?: string
  insurance_expiration?: string
  insurance_provider?: string
  insurance_policy_number?: string
  dot_inspection_date?: string
  dot_inspection_expiration?: string
  dot_number?: string
  oems_inspection_date?: string
  oems_inspection_expiration?: string
  oems_certification_number?: string
  annual_inspection_date?: string
  annual_inspection_expiration?: string
  emissions_test_date?: string
  emissions_test_expiration?: string
  medical_equipment_certification?: string
  medical_equipment_cert_expiration?: string
  radio_license_expiration?: string
  narcotics_license_expiration?: string
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
    registration_expiration: vehicle?.registration_expiration || "",
    insurance_expiration: vehicle?.insurance_expiration || "",
    insurance_provider: vehicle?.insurance_provider || "",
    insurance_policy_number: vehicle?.insurance_policy_number || "",
    dot_inspection_date: vehicle?.dot_inspection_date || "",
    dot_inspection_expiration: vehicle?.dot_inspection_expiration || "",
    dot_number: vehicle?.dot_number || "",
    oems_inspection_date: vehicle?.oems_inspection_date || "",
    oems_inspection_expiration: vehicle?.oems_inspection_expiration || "",
    oems_certification_number: vehicle?.oems_certification_number || "",
    annual_inspection_date: vehicle?.annual_inspection_date || "",
    annual_inspection_expiration: vehicle?.annual_inspection_expiration || "",
    emissions_test_date: vehicle?.emissions_test_date || "",
    emissions_test_expiration: vehicle?.emissions_test_expiration || "",
    medical_equipment_certification: vehicle?.medical_equipment_certification || "",
    medical_equipment_cert_expiration: vehicle?.medical_equipment_cert_expiration || "",
    radio_license_expiration: vehicle?.radio_license_expiration || "",
    narcotics_license_expiration: vehicle?.narcotics_license_expiration || "",
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
    <Card className="apple-card max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</CardTitle>
        <CardDescription>
          {vehicle ? "Update vehicle information and compliance records" : "Enter details for the new vehicle"}
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

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 rounded-2xl bg-muted/50">
              <TabsTrigger value="basic" className="rounded-xl text-xs md:text-sm">
                <FileText className="h-4 w-4 mr-1 md:mr-2 flex-shrink-0" />
                <span className="truncate">Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="registration" className="rounded-xl text-xs md:text-sm">
                <Shield className="h-4 w-4 mr-1 md:mr-2 flex-shrink-0" />
                <span className="truncate">Registration</span>
              </TabsTrigger>
              <TabsTrigger value="inspections" className="rounded-xl text-xs md:text-sm">
                <Wrench className="h-4 w-4 mr-1 md:mr-2 flex-shrink-0" />
                <span className="truncate">Inspections</span>
              </TabsTrigger>
              <TabsTrigger value="certifications" className="rounded-xl text-xs md:text-sm">
                <Calendar className="h-4 w-4 mr-1 md:mr-2 flex-shrink-0" />
                <span className="truncate">Certifications</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="vehicle_number"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Vehicle Number *
                  </Label>
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
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) => handleInputChange("vehicle_type", value)}
                  >
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
                  <Label
                    htmlFor="make"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Make *
                  </Label>
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
                  <Label
                    htmlFor="model"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Model *
                  </Label>
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
                  <Label
                    htmlFor="year"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Year *
                  </Label>
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
                  <Label
                    htmlFor="vin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    VIN *
                  </Label>
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
                  <Label
                    htmlFor="license_plate"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    License Plate *
                  </Label>
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
                  <Label
                    htmlFor="mileage"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Current Mileage
                  </Label>
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
                  <Label
                    htmlFor="fuel_capacity"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Fuel Capacity (gallons)
                  </Label>
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
            </TabsContent>

            <TabsContent value="registration" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="registration_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Registration Expiration
                  </Label>
                  <Input
                    id="registration_expiration"
                    type="date"
                    value={formData.registration_expiration}
                    onChange={(e) => handleInputChange("registration_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="insurance_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insurance Expiration
                  </Label>
                  <Input
                    id="insurance_expiration"
                    type="date"
                    value={formData.insurance_expiration}
                    onChange={(e) => handleInputChange("insurance_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="insurance_provider"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insurance Provider
                  </Label>
                  <Input
                    id="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={(e) => handleInputChange("insurance_provider", e.target.value)}
                    placeholder="State Farm, Geico, etc."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="insurance_policy_number"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Policy Number
                  </Label>
                  <Input
                    id="insurance_policy_number"
                    value={formData.insurance_policy_number}
                    onChange={(e) => handleInputChange("insurance_policy_number", e.target.value)}
                    placeholder="Policy number"
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inspections" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="dot_inspection_date"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    DOT Inspection Date
                  </Label>
                  <Input
                    id="dot_inspection_date"
                    type="date"
                    value={formData.dot_inspection_date}
                    onChange={(e) => handleInputChange("dot_inspection_date", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dot_inspection_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    DOT Inspection Expiration
                  </Label>
                  <Input
                    id="dot_inspection_expiration"
                    type="date"
                    value={formData.dot_inspection_expiration}
                    onChange={(e) => handleInputChange("dot_inspection_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dot_number"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    DOT Number
                  </Label>
                  <Input
                    id="dot_number"
                    value={formData.dot_number}
                    onChange={(e) => handleInputChange("dot_number", e.target.value)}
                    placeholder="DOT-123456"
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="oems_inspection_date"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    OEMS Inspection Date
                  </Label>
                  <Input
                    id="oems_inspection_date"
                    type="date"
                    value={formData.oems_inspection_date}
                    onChange={(e) => handleInputChange("oems_inspection_date", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="oems_inspection_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    OEMS Inspection Expiration
                  </Label>
                  <Input
                    id="oems_inspection_expiration"
                    type="date"
                    value={formData.oems_inspection_expiration}
                    onChange={(e) => handleInputChange("oems_inspection_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="oems_certification_number"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    OEMS Certification Number
                  </Label>
                  <Input
                    id="oems_certification_number"
                    value={formData.oems_certification_number}
                    onChange={(e) => handleInputChange("oems_certification_number", e.target.value)}
                    placeholder="OEMS-123456"
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="annual_inspection_date"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Annual Inspection Date
                  </Label>
                  <Input
                    id="annual_inspection_date"
                    type="date"
                    value={formData.annual_inspection_date}
                    onChange={(e) => handleInputChange("annual_inspection_date", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="annual_inspection_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Annual Inspection Expiration
                  </Label>
                  <Input
                    id="annual_inspection_expiration"
                    type="date"
                    value={formData.annual_inspection_expiration}
                    onChange={(e) => handleInputChange("annual_inspection_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="emissions_test_date"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Emissions Test Date
                  </Label>
                  <Input
                    id="emissions_test_date"
                    type="date"
                    value={formData.emissions_test_date}
                    onChange={(e) => handleInputChange("emissions_test_date", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="emissions_test_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Emissions Test Expiration
                  </Label>
                  <Input
                    id="emissions_test_expiration"
                    type="date"
                    value={formData.emissions_test_expiration}
                    onChange={(e) => handleInputChange("emissions_test_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="medical_equipment_certification" className="text-sm font-medium leading-none">
                    Medical Equipment Cert Date
                  </Label>
                  <Input
                    id="medical_equipment_certification"
                    type="date"
                    value={formData.medical_equipment_certification}
                    onChange={(e) => handleInputChange("medical_equipment_certification", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical_equipment_cert_expiration" className="text-sm font-medium leading-none">
                    Medical Equipment Expiration
                  </Label>
                  <Input
                    id="medical_equipment_cert_expiration"
                    type="date"
                    value={formData.medical_equipment_cert_expiration}
                    onChange={(e) => handleInputChange("medical_equipment_cert_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="radio_license_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Radio License Expiration
                  </Label>
                  <Input
                    id="radio_license_expiration"
                    type="date"
                    value={formData.radio_license_expiration}
                    onChange={(e) => handleInputChange("radio_license_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="narcotics_license_expiration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Narcotics License Expiration
                  </Label>
                  <Input
                    id="narcotics_license_expiration"
                    type="date"
                    value={formData.narcotics_license_expiration}
                    onChange={(e) => handleInputChange("narcotics_license_expiration", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
            <Button type="submit" disabled={loading} className="apple-button flex-1 min-h-[44px]">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              <span className="truncate">{vehicle ? "Update Vehicle" : "Add Vehicle"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-transparent min-h-[44px]"
            >
              <X className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Cancel</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
