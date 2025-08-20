"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Building2, User, CheckCircle } from "lucide-react"

interface SetupWizardProps {
  user: any
  profile: any
}

export function SetupWizard({ user, profile }: SetupWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // User profile data
    fullName: user.user_metadata?.full_name || "",
    role: "admin", // First user is always admin

    // Organization data
    organizationName: "",
    organizationType: "hospital",
    address: "",
    phone: "",
    email: "",
    licenseNumber: "",
  })

  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      // Create organization
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.organizationName,
          organization_type: formData.organizationType,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          license_number: formData.licenseNumber,
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Create or update user profile
      const profileData = {
        email: user.email,
        full_name: formData.fullName,
        role: formData.role as "admin" | "staff",
        organization_id: organization.id,
        setup_completed: true,
      }

      if (profile) {
        // Update existing profile
        const { error: profileError } = await supabase.from("profiles").update(profileData).eq("id", profile.id)
      } else {
        // Create new profile
        const { error: profileError } = await supabase.from("profiles").insert(profileData)
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Setup error:", error)
      alert("There was an error setting up your organization. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: "Personal Information",
      description: "Tell us about yourself",
      icon: User,
    },
    {
      title: "Organization Details",
      description: "Set up your organization",
      icon: Building2,
    },
    {
      title: "Review & Complete",
      description: "Confirm your information",
      icon: CheckCircle,
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const stepNumber = index + 1
            const isActive = currentStep === stepNumber
            const isCompleted = currentStep > stepNumber

            return (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground bg-background text-muted-foreground"
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                {stepNumber < steps.length && (
                  <div className={`w-16 h-0.5 mx-2 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            )
          })}
        </div>
        <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        <CardDescription>{steps[currentStep - 1].description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label>Role</Label>
              <p className="text-sm text-muted-foreground mt-1">
                As the first user, you'll be set up as an administrator with full access to manage your organization.
              </p>
              <div className="mt-2 p-3 bg-primary/10 rounded-lg">
                <span className="font-medium text-primary">Administrator</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => handleInputChange("organizationName", e.target.value)}
                placeholder="Enter your organization name"
                required
              />
            </div>

            <div>
              <Label htmlFor="organizationType">Organization Type</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) => handleInputChange("organizationType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="ems">EMS Service</SelectItem>
                  <SelectItem value="fire_department">Fire Department</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your organization's address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@organization.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                placeholder="Enter license or certification number"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {formData.fullName}
                </p>
                <p>
                  <span className="font-medium">Role:</span> Administrator
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Organization Details</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {formData.organizationName}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {formData.organizationType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                {formData.address && (
                  <p>
                    <span className="font-medium">Address:</span> {formData.address}
                  </p>
                )}
                {formData.phone && (
                  <p>
                    <span className="font-medium">Phone:</span> {formData.phone}
                  </p>
                )}
                {formData.email && (
                  <p>
                    <span className="font-medium">Email:</span> {formData.email}
                  </p>
                )}
                {formData.licenseNumber && (
                  <p>
                    <span className="font-medium">License:</span> {formData.licenseNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={currentStep === 1 && !formData.fullName}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading || !formData.organizationName}>
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
