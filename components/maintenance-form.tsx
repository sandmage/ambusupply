"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Save, X, Wrench } from "lucide-react"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
}

interface MaintenanceRecord {
  id?: string
  vehicle_id: string
  maintenance_type: string
  description: string
  scheduled_date: string
  completed_date?: string
  mileage_at_service?: number
  cost?: number
  service_provider?: string
  parts_replaced?: any[]
  next_service_due?: string
  notes?: string
}

interface MaintenanceFormProps {
  maintenance?: MaintenanceRecord
  onSave: (maintenance: MaintenanceRecord) => void
  onCancel: () => void
}

export function MaintenanceForm({ maintenance, onSave, onCancel }: MaintenanceFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState<MaintenanceRecord>({
    vehicle_id: maintenance?.vehicle_id || "",
    maintenance_type: maintenance?.maintenance_type || "routine",
    description: maintenance?.description || "",
    scheduled_date: maintenance?.scheduled_date || new Date().toISOString().split("T")[0],
    completed_date: maintenance?.completed_date || "",
    mileage_at_service: maintenance?.mileage_at_service || 0,
    cost: maintenance?.cost || 0,
    service_provider: maintenance?.service_provider || "",
    parts_replaced: maintenance?.parts_replaced || [],
    next_service_due: maintenance?.next_service_due || "",
    notes: maintenance?.notes || "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringInterval, setRecurringInterval] = useState("3")

  const supabase = createClient()

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const { data } = await supabase
        .from("vehicles")
        .select("id, vehicle_number, make, model")
        .eq("status", "active")
        .order("vehicle_number")

      setVehicles(data || [])
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.vehicle_id) newErrors.vehicle_id = "Vehicle is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.scheduled_date) newErrors.scheduled_date = "Scheduled date is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const maintenanceData = {
        ...formData,
        cost: formData.cost || null,
        mileage_at_service: formData.mileage_at_service || null,
        parts_replaced: formData.parts_replaced?.length ? formData.parts_replaced : null,
      }

      if (maintenance?.id) {
        // Update existing maintenance
        const { error } = await supabase
          .from("maintenance_records")
          .update({
            ...maintenanceData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", maintenance.id)

        if (error) throw error
      } else {
        // Create new maintenance
        const { error } = await supabase.from("maintenance_records").insert([maintenanceData])

        if (error) throw error

        // If recurring, create additional records
        if (isRecurring) {
          const intervalMonths = Number.parseInt(recurringInterval)
          const recurringRecords = []

          for (let i = 1; i <= 4; i++) {
            const nextDate = new Date(formData.scheduled_date)
            nextDate.setMonth(nextDate.getMonth() + intervalMonths * i)

            recurringRecords.push({
              ...maintenanceData,
              scheduled_date: nextDate.toISOString().split("T")[0],
              description: `${formData.description} (Recurring ${i})`,
            })
          }

          const { error: recurringError } = await supabase.from("maintenance_records").insert(recurringRecords)

          if (recurringError) throw recurringError
        }
      }

      onSave(formData)
    } catch (error: any) {
      console.error("Error saving maintenance:", error)
      setErrors({ general: "Failed to save maintenance record. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MaintenanceRecord, value: string | number | any[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const addPart = () => {
    const newPart = { name: "", quantity: 1, cost: 0 }
    setFormData((prev) => ({
      ...prev,
      parts_replaced: [...(prev.parts_replaced || []), newPart],
    }))
  }

  const removePart = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      parts_replaced: prev.parts_replaced?.filter((_, i) => i !== index) || [],
    }))
  }

  const updatePart = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      parts_replaced: prev.parts_replaced?.map((part, i) => (i === index ? { ...part, [field]: value } : part)) || [],
    }))
  }

  return (
    <Card className="apple-card max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Wrench className="h-6 w-6 text-accent" />
          <div>
            <CardTitle className="text-2xl font-serif">
              {maintenance ? "Edit Maintenance" : "Schedule Maintenance"}
            </CardTitle>
            <CardDescription>
              {maintenance ? "Update maintenance record" : "Schedule new maintenance for vehicle"}
            </CardDescription>
          </div>
        </div>
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
              <Label htmlFor="vehicle_id">Vehicle *</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => handleInputChange("vehicle_id", value)}>
                <SelectTrigger className="rounded-xl">
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
              {errors.vehicle_id && <p className="text-sm text-destructive">{errors.vehicle_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type">Maintenance Type</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => handleInputChange("maintenance_type", value)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="emergency">Emergency Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleInputChange("scheduled_date", e.target.value)}
                className="rounded-xl"
              />
              {errors.scheduled_date && <p className="text-sm text-destructive">{errors.scheduled_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="completed_date">Completed Date</Label>
              <Input
                id="completed_date"
                type="date"
                value={formData.completed_date}
                onChange={(e) => handleInputChange("completed_date", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileage_at_service">Mileage at Service</Label>
              <Input
                id="mileage_at_service"
                type="number"
                value={formData.mileage_at_service}
                onChange={(e) => handleInputChange("mileage_at_service", Number.parseInt(e.target.value) || 0)}
                min="0"
                placeholder="0"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", Number.parseFloat(e.target.value) || 0)}
                min="0"
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_provider">Service Provider</Label>
              <Input
                id="service_provider"
                value={formData.service_provider}
                onChange={(e) => handleInputChange("service_provider", e.target.value)}
                placeholder="Internal / External Provider"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_service_due">Next Service Due</Label>
              <Input
                id="next_service_due"
                type="date"
                value={formData.next_service_due}
                onChange={(e) => handleInputChange("next_service_due", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the maintenance work to be performed..."
              className="rounded-xl min-h-[100px]"
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any additional notes or special instructions..."
              className="rounded-xl"
            />
          </div>

          {/* Parts Replaced Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Parts Replaced</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPart} className="rounded-xl bg-transparent">
                Add Part
              </Button>
            </div>
            {formData.parts_replaced?.map((part, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-xl">
                <Input
                  placeholder="Part name"
                  value={part.name}
                  onChange={(e) => updatePart(index, "name", e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={part.quantity}
                  onChange={(e) => updatePart(index, "quantity", Number.parseInt(e.target.value) || 1)}
                  min="1"
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  value={part.cost}
                  onChange={(e) => updatePart(index, "cost", Number.parseFloat(e.target.value) || 0)}
                  min="0"
                  className="rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePart(index)}
                  className="rounded-xl text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Recurring Maintenance */}
          {!maintenance && (
            <div className="space-y-4 p-4 border rounded-xl">
              <div className="flex items-center space-x-2">
                <Checkbox id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label htmlFor="recurring">Set up recurring maintenance</Label>
              </div>
              {isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="interval">Repeat every</Label>
                  <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                    <SelectTrigger className="w-48 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This will create 4 additional maintenance records at the specified interval
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={loading} className="apple-button flex-1">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {maintenance ? "Update Maintenance" : "Schedule Maintenance"}
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
