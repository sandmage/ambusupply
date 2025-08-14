"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, ArrowLeft, Building, MapPin, Package, Users, Settings, Rocket } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6

  // Setup form state
  const [setupData, setSetupData] = useState({
    // Step 1: Organization
    organizationName: "",
    organizationType: "",
    address: "",
    phone: "",
    email: "",

    // Step 2: Locations
    mainLocation: "",
    additionalLocations: [""],

    // Step 3: Inventory
    inventoryCategories: ["Emergency", "Consumables", "Equipment"],
    trackExpiration: true,
    autoReorder: true,

    // Step 4: Users
    adminName: "",
    adminEmail: "",
    userRoles: ["Administrator", "Manager", "Technician"],

    // Step 5: Preferences
    timezone: "",
    currency: "USD",
    notifications: true,

    // Step 6: Complete
    setupComplete: false,
  })

  const updateSetupData = (field: string, value: any) => {
    setSetupData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeSetup = () => {
    updateSetupData("setupComplete", true)
    // TODO: Save setup data to backend
    console.log("Setup completed:", setupData)
    router.push("/")
  }

  const progress = (currentStep / totalSteps) * 100

  const steps = [
    { number: 1, title: "Organization", icon: Building, description: "Basic organization details" },
    { number: 2, title: "Locations", icon: MapPin, description: "Setup your locations" },
    { number: 3, title: "Inventory", icon: Package, description: "Configure inventory settings" },
    { number: 4, title: "Users", icon: Users, description: "Setup user roles" },
    { number: 5, title: "Preferences", icon: Settings, description: "System preferences" },
    { number: 6, title: "Complete", icon: Rocket, description: "Finish setup" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">AmbuSupply Setup</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Welcome to AmbuSupply! Let's get your emergency medical supply management system configured in just a few
            steps.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isActive
                          ? "bg-emerald-100 text-emerald-600 ring-4 ring-emerald-200"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium ${isActive ? "text-emerald-600" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">{steps[currentStep - 1].title}</CardTitle>
              <CardDescription className="text-gray-600">{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Organization */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      placeholder="e.g., Metro Emergency Services"
                      value={setupData.organizationName}
                      onChange={(e) => updateSetupData("organizationName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgType">Organization Type</Label>
                    <Select
                      value={setupData.organizationType}
                      onValueChange={(value) => updateSetupData("organizationType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="ems">EMS Service</SelectItem>
                        <SelectItem value="fire-dept">Fire Department</SelectItem>
                        <SelectItem value="clinic">Medical Clinic</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your organization's address"
                      value={setupData.address}
                      onChange={(e) => updateSetupData("address", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="(555) 123-4567"
                        value={setupData.phone}
                        onChange={(e) => updateSetupData("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@organization.com"
                        value={setupData.email}
                        onChange={(e) => updateSetupData("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Locations */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mainLocation">Main Location Name *</Label>
                    <Input
                      id="mainLocation"
                      placeholder="e.g., Headquarters, Main Station"
                      value={setupData.mainLocation}
                      onChange={(e) => updateSetupData("mainLocation", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Additional Locations (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-2">Add other locations where you store supplies</p>
                    {setupData.additionalLocations.map((location, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Location ${index + 1}`}
                          value={location}
                          onChange={(e) => {
                            const newLocations = [...setupData.additionalLocations]
                            newLocations[index] = e.target.value
                            updateSetupData("additionalLocations", newLocations)
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newLocations = setupData.additionalLocations.filter((_, i) => i !== index)
                            updateSetupData("additionalLocations", newLocations)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSetupData("additionalLocations", [...setupData.additionalLocations, ""])}
                    >
                      Add Location
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Inventory */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Inventory Categories</Label>
                    <p className="text-sm text-gray-500 mb-2">These categories will help organize your supplies</p>
                    <div className="space-y-2">
                      {setupData.inventoryCategories.map((category, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={category}
                            onChange={(e) => {
                              const newCategories = [...setupData.inventoryCategories]
                              newCategories[index] = e.target.value
                              updateSetupData("inventoryCategories", newCategories)
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newCategories = setupData.inventoryCategories.filter((_, i) => i !== index)
                              updateSetupData("inventoryCategories", newCategories)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetupData("inventoryCategories", [...setupData.inventoryCategories, ""])}
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Track Expiration Dates</Label>
                        <p className="text-sm text-gray-500">Monitor expiration dates for medical supplies</p>
                      </div>
                      <Switch
                        checked={setupData.trackExpiration}
                        onCheckedChange={(checked) => updateSetupData("trackExpiration", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Reorder Supplies</Label>
                        <p className="text-sm text-gray-500">Automatically create orders when stock is low</p>
                      </div>
                      <Switch
                        checked={setupData.autoReorder}
                        onCheckedChange={(checked) => updateSetupData("autoReorder", checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Users */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adminName">Administrator Name *</Label>
                    <Input
                      id="adminName"
                      placeholder="Your full name"
                      value={setupData.adminName}
                      onChange={(e) => updateSetupData("adminName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Administrator Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@organization.com"
                      value={setupData.adminEmail}
                      onChange={(e) => updateSetupData("adminEmail", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>User Roles</Label>
                    <p className="text-sm text-gray-500 mb-2">Define roles for your team members</p>
                    <div className="space-y-2">
                      {setupData.userRoles.map((role, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={role}
                            onChange={(e) => {
                              const newRoles = [...setupData.userRoles]
                              newRoles[index] = e.target.value
                              updateSetupData("userRoles", newRoles)
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newRoles = setupData.userRoles.filter((_, i) => i !== index)
                              updateSetupData("userRoles", newRoles)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetupData("userRoles", [...setupData.userRoles, ""])}
                      >
                        Add Role
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Preferences */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={setupData.timezone} onValueChange={(value) => updateSetupData("timezone", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                        <SelectItem value="CST">Central Time (CST)</SelectItem>
                        <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                        <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={setupData.currency} onValueChange={(value) => updateSetupData("currency", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive alerts and updates via email</p>
                    </div>
                    <Switch
                      checked={setupData.notifications}
                      onCheckedChange={(checked) => updateSetupData("notifications", checked)}
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Complete */}
              {currentStep === 6 && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h3>
                    <p className="text-gray-600">
                      Your AmbuSupply system is now configured and ready to use. You can always modify these settings
                      later in the Settings page.
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-medium text-emerald-900 mb-2">What's Next?</h4>
                    <ul className="text-sm text-emerald-700 space-y-1 text-left">
                      <li>• Add your first inventory items</li>
                      <li>• Set up your fleet vehicles</li>
                      <li>• Invite team members</li>
                      <li>• Configure suppliers and orders</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button onClick={nextStep} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={completeSetup}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Complete Setup
                    <Rocket className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
