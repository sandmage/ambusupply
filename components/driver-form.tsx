"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Save, X, User, Plus, Trash2 } from "lucide-react"

interface Driver {
  id?: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  license_number: string
  license_expiry: string
  certifications?: any[]
  status: string
  hire_date: string
}

interface DriverFormProps {
  driver?: Driver
  onSave: (driver: Driver) => void
  onCancel: () => void
}

export function DriverForm({ driver, onSave, onCancel }: DriverFormProps) {
  const [formData, setFormData] = useState<Driver>({
    employee_id: driver?.employee_id || "",
    first_name: driver?.first_name || "",
    last_name: driver?.last_name || "",
    email: driver?.email || "",
    phone: driver?.phone || "",
    license_number: driver?.license_number || "",
    license_expiry: driver?.license_expiry || "",
    certifications: driver?.certifications || [],
    status: driver?.status || "available",
    hire_date: driver?.hire_date || new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createClient()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.employee_id.trim()) newErrors.employee_id = "Employee ID is required"
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required"
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.license_number.trim()) newErrors.license_number = "License number is required"
    if (!formData.license_expiry) newErrors.license_expiry = "License expiry is required"
    if (!formData.hire_date) newErrors.hire_date = "Hire date is required"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // License expiry validation
    if (formData.license_expiry && new Date(formData.license_expiry) <= new Date()) {
      newErrors.license_expiry = "License expiry must be in the future"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const driverData = {
        ...formData,
        certifications: formData.certifications?.length ? formData.certifications : null,
      }

      if (driver?.id) {
        // Update existing driver
        const { error } = await supabase
          .from("drivers")
          .update({
            ...driverData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", driver.id)

        if (error) throw error
      } else {
        // Create new driver
        const { error } = await supabase.from("drivers").insert([driverData])

        if (error) throw error
      }

      onSave(formData)
    } catch (error: any) {
      console.error("Error saving driver:", error)
      if (error.code === "23505") {
        // Unique constraint violation
        if (error.message.includes("employee_id")) {
          setErrors({ employee_id: "Employee ID already exists" })
        } else if (error.message.includes("email")) {
          setErrors({ email: "Email already exists" })
        } else if (error.message.includes("license_number")) {
          setErrors({ license_number: "License number already exists" })
        }
      } else {
        setErrors({ general: "Failed to save driver. Please try again." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Driver, value: string | any[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const addCertification = () => {
    const newCert = { name: "", issuer: "", expiry_date: "", number: "" }
    setFormData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
    }))
  }

  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateCertification = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications?.map((cert, i) => (i === index ? { ...cert, [field]: value } : cert)) || [],
    }))
  }

  return (
    <Card className="apple-card max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-2xl font-serif">{driver ? "Edit Driver" : "Add New Driver"}</CardTitle>
            <CardDescription>
              {driver ? "Update driver information" : "Enter details for the new driver"}
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
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => handleInputChange("employee_id", e.target.value)}
                placeholder="EMP-001"
                className="rounded-xl"
              />
              {errors.employee_id && <p className="text-sm text-destructive">{errors.employee_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="John"
                className="rounded-xl"
              />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Doe"
                className="rounded-xl"
              />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="john.doe@example.com"
                className="rounded-xl"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">License Number *</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange("license_number", e.target.value.toUpperCase())}
                placeholder="D123456789"
                className="rounded-xl font-mono"
              />
              {errors.license_number && <p className="text-sm text-destructive">{errors.license_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry">License Expiry *</Label>
              <Input
                id="license_expiry"
                type="date"
                value={formData.license_expiry}
                onChange={(e) => handleInputChange("license_expiry", e.target.value)}
                className="rounded-xl"
              />
              {errors.license_expiry && <p className="text-sm text-destructive">{errors.license_expiry}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleInputChange("hire_date", e.target.value)}
                className="rounded-xl"
              />
              {errors.hire_date && <p className="text-sm text-destructive">{errors.hire_date}</p>}
            </div>
          </div>

          {/* Certifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Certifications</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertification}
                className="rounded-xl bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>
            {formData.certifications?.map((cert, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-xl">
                <Input
                  placeholder="Certification name"
                  value={cert.name}
                  onChange={(e) => updateCertification(index, "name", e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Issuing authority"
                  value={cert.issuer}
                  onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Certificate number"
                  value={cert.number}
                  onChange={(e) => updateCertification(index, "number", e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  type="date"
                  placeholder="Expiry date"
                  value={cert.expiry_date}
                  onChange={(e) => updateCertification(index, "expiry_date", e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCertification(index)}
                  className="rounded-xl text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={loading} className="apple-button flex-1">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {driver ? "Update Driver" : "Add Driver"}
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
