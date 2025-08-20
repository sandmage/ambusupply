"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Building2, User, CheckCircle, AlertTriangle, Loader2, Save } from "lucide-react"

interface SetupWizardProps {
  user: any
  profile: any
  existingOrganization?: any
  isRerun?: boolean
}

interface FormData {
  fullName: string
  role: string
  organizationName: string
  organizationType: string
  address: string
  phone: string
  email: string
  licenseNumber: string
}

interface ValidationErrors {
  [key: string]: string
}

export function SetupWizard({ user, profile, existingOrganization, isRerun = false }: SetupWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [retryCount, setRetryCount] = useState(0)
  const [isInvitedUser, setIsInvitedUser] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    fullName: profile?.full_name || user.user_metadata?.full_name || "",
    role: profile?.role || "admin",
    organizationName: existingOrganization?.name || "",
    organizationType: existingOrganization?.organization_type || "hospital",
    address: existingOrganization?.address || "",
    phone: existingOrganization?.phone || "",
    email: existingOrganization?.email || "",
    licenseNumber: existingOrganization?.license_number || "",
  })

  const supabase = createClient()

  useEffect(() => {
    const checkInvitationStatus = async () => {
      if (profile?.organization_id || user.user_metadata?.invitation_id) {
        setIsInvitedUser(true)
        setCurrentStep(3)
      }
    }

    checkInvitationStatus()

    if (isRerun && existingOrganization) {
      return
    }

    const savedData = localStorage.getItem("setup-wizard-progress")
    const savedStep = localStorage.getItem("setup-wizard-step")

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error("Failed to parse saved setup data:", e)
      }
    }

    if (savedStep) {
      const step = Number.parseInt(savedStep)
      if (step >= 1 && step <= 3) {
        setCurrentStep(step)
      }
    }
  }, [isRerun, existingOrganization, profile, user])

  useEffect(() => {
    const saveProgress = async () => {
      setSaving(true)
      localStorage.setItem("setup-wizard-progress", JSON.stringify(formData))
      localStorage.setItem("setup-wizard-step", currentStep.toString())

      setTimeout(() => setSaving(false), 500)
    }

    const timeoutId = setTimeout(saveProgress, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData, currentStep])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phone === "" || phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  const validateStep = (step: number): ValidationErrors => {
    const errors: ValidationErrors = {}

    if (step === 1) {
      if (!formData.fullName.trim()) {
        errors.fullName = "Full name is required"
      } else if (formData.fullName.trim().length < 2) {
        errors.fullName = "Full name must be at least 2 characters"
      }
    }

    if (step === 2 && !isInvitedUser) {
      if (!formData.organizationName.trim()) {
        errors.organizationName = "Organization name is required"
      } else if (formData.organizationName.trim().length < 2) {
        errors.organizationName = "Organization name must be at least 2 characters"
      }

      if (formData.email && !validateEmail(formData.email)) {
        errors.email = "Please enter a valid email address"
      }

      if (formData.phone && !validatePhone(formData.phone)) {
        errors.phone = "Please enter a valid phone number"
      }
    }

    return errors
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    if (error) setError(null)
  }

  const handleNext = () => {
    const errors = validateStep(currentStep)

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setValidationErrors({})
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setValidationErrors({})
    }
  }

  const handleComplete = async () => {
    if (isInvitedUser && profile?.organization_id) {
      setLoading(true)
      setError(null)

      try {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.fullName.trim(),
            setup_completed: true,
          })
          .eq("id", profile.id)

        if (profileError) throw profileError

        localStorage.removeItem("setup-wizard-progress")
        localStorage.removeItem("setup-wizard-step")

        router.push("/dashboard")
        return
      } catch (error: any) {
        console.error("Profile update error:", error)
        setError(`Failed to update profile: ${error.message}`)
        setLoading(false)
        return
      }
    }

    const errors = validateStep(2)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let organization = existingOrganization

      if (isRerun && existingOrganization) {
        const { data: updatedOrg, error: orgError } = await supabase
          .from("organizations")
          .update({
            name: formData.organizationName.trim(),
            organization_type: formData.organizationType,
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            license_number: formData.licenseNumber.trim() || null,
          })
          .eq("id", existingOrganization.id)
          .select()
          .single()

        if (orgError) throw orgError
        organization = updatedOrg
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: formData.organizationName.trim(),
            organization_type: formData.organizationType,
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            license_number: formData.licenseNumber.trim() || null,
          })
          .select()
          .single()

        if (orgError) throw orgError
        organization = newOrg
      }

      const profileData = {
        email: user.email,
        full_name: formData.fullName.trim(),
        role: formData.role as "admin" | "staff",
        organization_id: organization.id,
        setup_completed: true,
      }

      if (profile) {
        const { error: profileError } = await supabase.from("profiles").update(profileData).eq("id", profile.id)
        if (profileError) throw profileError
      } else {
        const { error: profileError } = await supabase.from("profiles").insert({ ...profileData, id: user.id })
        if (profileError) throw profileError
      }

      localStorage.removeItem("setup-wizard-progress")
      localStorage.removeItem("setup-wizard-step")

      router.push(isRerun ? "/settings" : "/dashboard")
    } catch (error: any) {
      console.error("Setup error:", error)
      setRetryCount((prev) => prev + 1)

      if (error.message?.includes("organizations")) {
        setError(
          "The organizations table doesn't exist yet. Please run the database setup script first. Go to the Scripts section and run 'scripts/005_create_organizations.sql'.",
        )
      } else if (error.message?.includes("duplicate key")) {
        setError("An organization with this name already exists. Please choose a different name.")
      } else if (error.message?.includes("network") || error.code === "PGRST301") {
        setError("Network error occurred. Please check your connection and try again.")
      } else {
        setError(`Setup failed: ${error.message || "Unknown error occurred"}. Please try again or contact support.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleComplete()
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

  const progress = (currentStep / steps.length) * 100

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}
              </span>
              {saving && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Save className="w-3 h-3" />
                  Saving...
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>

          <Progress value={progress} className="w-full" />

          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const stepNumber = index + 1
              const isActive = currentStep === stepNumber
              const isCompleted = currentStep > stepNumber

              return (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
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
                    <div className={`w-16 h-0.5 mx-2 transition-colors ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {isRerun && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            You're updating your organization setup. All fields have been pre-filled with your current information.
          </div>
        )}

        {isInvitedUser && !isRerun && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            Welcome! You've joined an organization via invitation. Please confirm your personal information to complete
            setup.
          </div>
        )}

        <CardTitle className="text-2xl">
          {isRerun ? `Update ${steps[currentStep - 1].title}` : steps[currentStep - 1].title}
        </CardTitle>
        <CardDescription className="text-base">
          {isRerun ? `Update ${steps[currentStep - 1].description}` : steps[currentStep - 1].description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {retryCount > 0 && !loading && (
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Enter your full name"
                className={validationErrors.fullName ? "border-destructive" : ""}
              />
              {validationErrors.fullName && (
                <p className="text-sm text-destructive mt-1">{validationErrors.fullName}</p>
              )}
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

        {currentStep === 2 && !isInvitedUser && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => handleInputChange("organizationName", e.target.value)}
                placeholder="Enter your organization name"
                className={validationErrors.organizationName ? "border-destructive" : ""}
              />
              {validationErrors.organizationName && (
                <p className="text-sm text-destructive mt-1">{validationErrors.organizationName}</p>
              )}
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
                  <SelectItem value="urgent_care">Urgent Care</SelectItem>
                  <SelectItem value="nursing_home">Nursing Home</SelectItem>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className={validationErrors.phone ? "border-destructive" : ""}
                />
                {validationErrors.phone && <p className="text-sm text-destructive mt-1">{validationErrors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@organization.com"
                  className={validationErrors.email ? "border-destructive" : ""}
                />
                {validationErrors.email && <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                placeholder="Enter license or certification number (optional)"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-lg">Personal Information</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {formData.fullName}
                </p>
                <p>
                  <span className="font-medium">Role:</span>{" "}
                  {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                </p>
              </div>
            </div>

            {!isInvitedUser && (
              <div>
                <h3 className="font-semibold mb-3 text-lg">Organization Details</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p>
                    <span className="font-medium">Name:</span> {formData.organizationName}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {formData.organizationType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
            )}
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading || (isInvitedUser && currentStep === 3)}
          >
            Back
          </Button>

          {currentStep < 3 && !isInvitedUser ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
            </Button>
          ) : currentStep === 1 && isInvitedUser ? (
            <Button onClick={() => setCurrentStep(3)} disabled={loading}>
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
