"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Send,
  Eye,
  Car,
  Wrench,
  Package,
  Shield,
  Settings,
} from "lucide-react"

interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
  make: string
  model: string
  status: string
}

interface ChecklistItem {
  id: string
  type: "checkbox" | "text" | "number" | "select" | "textarea"
  label: string
  description?: string
  required: boolean
  category: "equipment" | "inventory" | "safety" | "maintenance" | "other"
  options?: string[]
  order: number
}

interface DailyCheckForm {
  id: string
  name: string
  description: string
  vehicle_types: string[]
  checklist_items: ChecklistItem[]
  is_active: boolean
}

interface DailyCheckSubmission {
  id?: string
  form_id: string
  vehicle_id: string
  submitted_at: string
  shift_start_time?: string
  shift_end_time?: string
  pre_trip_mileage?: number
  post_trip_mileage?: number
  checklist_responses: Record<string, any>
  issues_found: string[]
  overall_status: "pass" | "fail" | "conditional"
  notes?: string
  submitted_by?: string
}

interface DailyCheckSubmissionProps {
  vehicles: Vehicle[]
}

export function DailyCheckSubmission({ vehicles }: DailyCheckSubmissionProps) {
  const [forms, setForms] = useState<DailyCheckForm[]>([])
  const [submissions, setSubmissions] = useState<DailyCheckSubmission[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [selectedForm, setSelectedForm] = useState<DailyCheckForm | null>(null)
  const [currentSubmission, setCurrentSubmission] = useState<DailyCheckSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("submit")

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch active forms
      const { data: formsData } = await supabase
        .from("daily_check_forms")
        .select("*")
        .eq("is_active", true)
        .order("name")

      // Fetch recent submissions
      const { data: submissionsData } = await supabase
        .from("daily_check_submissions")
        .select(`
          *,
          form:daily_check_forms(name),
          vehicle:vehicles(vehicle_number, make, model),
          submitted_by_profile:profiles(first_name, last_name)
        `)
        .order("submitted_at", { ascending: false })
        .limit(20)

      setForms(formsData || [])
      setSubmissions(submissionsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (vehicle) {
      // Find applicable forms for this vehicle type
      const applicableForms = forms.filter(
        (form) =>
          form.vehicle_types && Array.isArray(form.vehicle_types) && form.vehicle_types.includes(vehicle.vehicle_type),
      )
      if (applicableForms.length === 1) {
        setSelectedForm(applicableForms[0])
        initializeSubmission(applicableForms[0], vehicleId)
      } else if (applicableForms.length > 1) {
        // Let user choose form if multiple applicable
        setSelectedForm(null)
      }
    }
  }

  const initializeSubmission = (form: DailyCheckForm, vehicleId: string) => {
    const newSubmission: DailyCheckSubmission = {
      form_id: form.id,
      vehicle_id: vehicleId,
      submitted_at: new Date().toISOString().split("T")[0],
      checklist_responses: {},
      issues_found: [],
      overall_status: "pass",
    }
    setCurrentSubmission(newSubmission)
  }

  const handleResponseChange = (itemId: string, value: any) => {
    if (!currentSubmission) return

    setCurrentSubmission({
      ...currentSubmission,
      checklist_responses: {
        ...currentSubmission.checklist_responses,
        [itemId]: value,
      },
    })
  }

  const handleSubmit = async () => {
    if (!currentSubmission || !selectedForm) return

    setSubmitting(true)
    try {
      // Validate required fields
      const requiredItems = selectedForm.checklist_items.filter((item) => item.required)
      const missingRequired = requiredItems.filter(
        (item) =>
          !currentSubmission.checklist_responses[item.id] && currentSubmission.checklist_responses[item.id] !== 0,
      )

      if (missingRequired.length > 0) {
        alert(`Please complete all required fields: ${missingRequired.map((item) => item.label).join(", ")}`)
        return
      }

      // Determine overall status based on responses
      let overallStatus: "pass" | "fail" | "conditional" = "pass"
      const issues: string[] = []

      selectedForm.checklist_items.forEach((item) => {
        const response = currentSubmission.checklist_responses[item.id]
        if (item.type === "checkbox" && !response) {
          issues.push(`${item.label}: Not checked`)
          overallStatus = "fail"
        }
      })

      const submissionData = {
        ...currentSubmission,
        issues_found: issues,
        overall_status: overallStatus,
        submitted_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("daily_check_submissions").insert([submissionData])

      if (error) throw error

      // Reset form
      setCurrentSubmission(null)
      setSelectedForm(null)
      setSelectedVehicle("")
      setShowSubmissionDialog(false)
      fetchData()

      alert("Daily check submitted successfully!")
    } catch (error) {
      console.error("Error submitting daily check:", error)
      alert("Failed to submit daily check. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "equipment":
        return <Wrench className="h-4 w-4" />
      case "inventory":
        return <Package className="h-4 w-4" />
      case "safety":
        return <Shield className="h-4 w-4" />
      case "maintenance":
        return <Settings className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "fail":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "conditional":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const renderFormField = (item: ChecklistItem) => {
    const value = currentSubmission?.checklist_responses[item.id]

    switch (item.type) {
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={item.id}
              checked={value || false}
              onCheckedChange={(checked) => handleResponseChange(item.id, checked)}
            />
            <Label htmlFor={item.id} className="text-sm">
              {item.label}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        )

      case "text":
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>
              {item.label}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.id}
              value={value || ""}
              onChange={(e) => handleResponseChange(item.id, e.target.value)}
              placeholder={item.description}
              className="apple-input"
            />
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>
              {item.label}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.id}
              type="number"
              value={value || ""}
              onChange={(e) => handleResponseChange(item.id, Number.parseFloat(e.target.value) || 0)}
              placeholder={item.description}
              className="apple-input"
            />
          </div>
        )

      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>
              {item.label}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ""} onValueChange={(val) => handleResponseChange(item.id, val)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {item.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={item.id}>
              {item.label}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={item.id}
              value={value || ""}
              onChange={(e) => handleResponseChange(item.id, e.target.value)}
              placeholder={item.description}
              className="apple-input min-h-[80px]"
            />
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading daily check forms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Daily Vehicle Checks</h2>
          <p className="text-muted-foreground">Submit and review daily vehicle inspection forms</p>
        </div>
        <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
          <DialogTrigger asChild>
            <Button className="apple-button">
              <Plus className="h-4 w-4 mr-2" />
              New Daily Check
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Daily Vehicle Check</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">Select a vehicle and complete the daily inspection checklist.</p>
              {/* This would contain the same form logic as above but in a dialog */}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="submit" className="rounded-xl">
            Submit Check
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl">
            Submission History
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl">
            Pending Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Submit Daily Vehicle Check</CardTitle>
              <CardDescription>Complete the daily inspection checklist for your assigned vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label>Select Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={handleVehicleSelect}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles
                      .filter((v) => v.status === "active")
                      .map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Form Selection (if multiple applicable) */}
              {selectedVehicle && !selectedForm && forms.length > 1 && (
                <div className="space-y-2">
                  <Label>Select Check Form</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      const vehicle = vehicles.find((v) => v.id === selectedVehicle)
                      if (!vehicle) return null

                      const applicableForms = forms.filter((form) => {
                        return (
                          form &&
                          form.vehicle_types &&
                          Array.isArray(form.vehicle_types) &&
                          form.vehicle_types.includes(vehicle.vehicle_type)
                        )
                      }) as DailyCheckForm[]

                      return applicableForms.map((form) => (
                        <Card
                          key={form.id}
                          className={`cursor-pointer transition-all ${
                            selectedForm?.id === form.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                          onClick={() => {
                            setSelectedForm(form)
                            initializeSubmission(form, selectedVehicle)
                          }}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-medium">{form.name}</h4>
                            <p className="text-sm text-muted-foreground">{form.checklist_items?.length || 0} items</p>
                          </CardContent>
                        </Card>
                      ))
                    })()}
                  </div>
                </div>
              )}

              {/* Daily Check Form */}
              {currentSubmission && selectedForm && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Shift Start Time</Label>
                      <Input
                        type="time"
                        value={currentSubmission.shift_start_time || ""}
                        onChange={(e) =>
                          setCurrentSubmission({
                            ...currentSubmission,
                            shift_start_time: e.target.value,
                          })
                        }
                        className="apple-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pre-Trip Mileage</Label>
                      <Input
                        type="number"
                        value={currentSubmission.pre_trip_mileage || ""}
                        onChange={(e) =>
                          setCurrentSubmission({
                            ...currentSubmission,
                            pre_trip_mileage: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        className="apple-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Post-Trip Mileage</Label>
                      <Input
                        type="number"
                        value={currentSubmission.post_trip_mileage || ""}
                        onChange={(e) =>
                          setCurrentSubmission({
                            ...currentSubmission,
                            post_trip_mileage: Number.parseInt(e.target.value) || 0,
                          })
                        }
                        className="apple-input"
                      />
                    </div>
                  </div>

                  {/* Checklist Items by Category */}
                  {["equipment", "inventory", "safety", "maintenance", "other"].map((category) => {
                    const categoryItems = selectedForm.checklist_items
                      .filter((item) => item.category === category)
                      .sort((a, b) => a.order - b.order)

                    if (categoryItems.length === 0) return null

                    return (
                      <Card key={category} className="apple-card">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg capitalize">
                            {getCategoryIcon(category)}
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {categoryItems.map((item) => (
                            <div key={item.id} className="space-y-2">
                              {renderFormField(item)}
                              {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )
                  })}

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={currentSubmission.notes || ""}
                      onChange={(e) =>
                        setCurrentSubmission({
                          ...currentSubmission,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Any additional observations or issues..."
                      className="apple-input min-h-[100px]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSubmit} disabled={submitting} className="apple-button flex-1">
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit Daily Check
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentSubmission(null)
                        setSelectedForm(null)
                        setSelectedVehicle("")
                      }}
                      className="rounded-xl bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((submission: any) => (
              <Card key={submission.id} className="apple-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">
                          {submission.vehicle?.vehicle_number} - {submission.form?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(submission.submitted_at).toLocaleDateString()} by{" "}
                          {submission.submitted_by_profile?.first_name} {submission.submitted_by_profile?.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.overall_status)}
                      <Badge
                        variant={
                          submission.overall_status === "pass"
                            ? "secondary"
                            : submission.overall_status === "fail"
                              ? "destructive"
                              : "default"
                        }
                        className="capitalize"
                      >
                        {submission.overall_status}
                      </Badge>
                      <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  {submission.issues_found?.length > 0 && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {submission.issues_found.length} issue(s) found: {submission.issues_found.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card className="apple-card">
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No pending reviews</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
