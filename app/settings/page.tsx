"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  const [showApiKey, setShowApiKey] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    organizationName: "Emergency Medical Services",
    timezone: "America/New_York",
    language: "en",
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  })

  const [systemPreferences, setSystemPreferences] = useState({
    darkMode: false,
    notifications: true,
    autoSave: true,
    compactView: false,
    showTutorials: true,
  })

  const [businessRules, setBusinessRules] = useState({
    inventory: {
      autoReorder: true,
      reorderThreshold: 20,
      maxOrderQuantity: 1000,
      expirationAlert: 30,
    },
    fleet: {
      maintenanceInterval: 5000,
      fuelThreshold: 25,
      deploymentRadius: 50,
    },
    orders: {
      approvalRequired: true,
      approvalThreshold: 500,
      emergencyOverride: true,
    },
  })

  const [inventoryCategories, setInventoryCategories] = useState([
    {
      id: "emergency",
      name: "Emergency",
      description: "Critical emergency supplies",
      color: "#ef4444",
      subcategories: ["Trauma", "Cardiac", "Respiratory"],
    },
    {
      id: "medications",
      name: "Medications",
      description: "Pharmaceutical supplies",
      color: "#3b82f6",
      subcategories: ["Pain Management", "Cardiac Drugs", "Antibiotics"],
    },
    {
      id: "equipment",
      name: "Equipment",
      description: "Medical equipment and devices",
      color: "#8b5cf6",
      subcategories: ["Monitoring", "Diagnostic", "Therapeutic"],
    },
    {
      id: "consumables",
      name: "Consumables",
      description: "Single-use medical supplies",
      color: "#f59e0b",
      subcategories: ["Bandages", "Syringes", "Gloves"],
    },
    {
      id: "ppe",
      name: "PPE",
      description: "Personal protective equipment",
      color: "#10b981",
      subcategories: ["Masks", "Gowns", "Eye Protection"],
    },
  ])

  const [statusTypes, setStatusTypes] = useState({
    inventory: [
      { id: "in-stock", name: "In Stock", color: "#10b981", description: "Available for use" },
      { id: "low-stock", name: "Low Stock", color: "#f59e0b", description: "Below minimum threshold" },
      { id: "critical", name: "Critical", color: "#ef4444", description: "Critically low stock" },
      { id: "out-of-stock", name: "Out of Stock", color: "#6b7280", description: "No stock available" },
      { id: "expired", name: "Expired", color: "#dc2626", description: "Past expiration date" },
    ],
    orders: [
      { id: "pending", name: "Pending", color: "#f59e0b", description: "Awaiting approval" },
      { id: "approved", name: "Approved", color: "#3b82f6", description: "Approved for processing" },
      { id: "processing", name: "Processing", color: "#8b5cf6", description: "Being prepared" },
      { id: "shipped", name: "Shipped", color: "#06b6d4", description: "In transit" },
      { id: "delivered", name: "Delivered", color: "#10b981", description: "Successfully delivered" },
      { id: "cancelled", name: "Cancelled", color: "#ef4444", description: "Order cancelled" },
    ],
    fleet: [
      { id: "available", name: "Available", color: "#10b981", description: "Ready for deployment" },
      { id: "deployed", name: "Deployed", color: "#3b82f6", description: "Currently on call" },
      { id: "maintenance", name: "Maintenance", color: "#f59e0b", description: "Under maintenance" },
      { id: "out-of-service", name: "Out of Service", color: "#ef4444", description: "Not operational" },
    ],
  })

  const [priorityLevels, setPriorityLevels] = useState([
    { id: "low", name: "Low", color: "#6b7280", description: "Standard priority", escalationTime: 24 },
    { id: "medium", name: "Medium", color: "#f59e0b", description: "Moderate priority", escalationTime: 8 },
    { id: "high", name: "High", color: "#ef4444", description: "High priority", escalationTime: 2 },
    { id: "critical", name: "Critical", color: "#dc2626", description: "Emergency priority", escalationTime: 0.5 },
  ])

  const [userRoles, setUserRoles] = useState([
    { id: "administrator", name: "Administrator", description: "Full system access", permissions: ["all"] },
    {
      id: "manager",
      name: "Manager",
      description: "Department management",
      permissions: ["inventory", "fleet", "orders", "reports"],
    },
    {
      id: "supervisor",
      name: "Supervisor",
      description: "Team supervision",
      permissions: ["inventory", "fleet", "reports"],
    },
    {
      id: "paramedic",
      name: "Paramedic",
      description: "Field operations",
      permissions: ["inventory:read", "fleet:read"],
    },
    { id: "viewer", name: "Viewer", description: "Read-only access", permissions: ["reports:read"] },
  ])

  const [supplierTypes, setSupplierTypes] = useState([
    { id: "medical", name: "Medical Supplies", description: "Primary medical equipment and supplies" },
    { id: "pharmaceutical", name: "Pharmaceutical", description: "Medication and drug suppliers" },
    { id: "equipment", name: "Equipment", description: "Medical devices and equipment" },
    { id: "maintenance", name: "Maintenance", description: "Vehicle and equipment maintenance" },
    { id: "fuel", name: "Fuel & Energy", description: "Fuel and energy suppliers" },
  ])

  const [customFields, setCustomFields] = useState({
    inventory: [
      { id: "lot-number", name: "Lot Number", type: "text", required: false },
      { id: "expiry-date", name: "Expiry Date", type: "date", required: true },
      { id: "manufacturer", name: "Manufacturer", type: "text", required: false },
      {
        id: "storage-temp",
        name: "Storage Temperature",
        type: "select",
        options: ["Room Temp", "Refrigerated", "Frozen"],
        required: false,
      },
    ],
    fleet: [
      { id: "vin", name: "VIN Number", type: "text", required: true },
      { id: "license-plate", name: "License Plate", type: "text", required: true },
      { id: "insurance-exp", name: "Insurance Expiry", type: "date", required: true },
      { id: "inspection-due", name: "Inspection Due", type: "date", required: true },
    ],
    orders: [
      { id: "po-number", name: "PO Number", type: "text", required: false },
      { id: "delivery-date", name: "Requested Delivery", type: "date", required: false },
      { id: "special-instructions", name: "Special Instructions", type: "textarea", required: false },
    ],
  })

  const [locationTypes, setLocationTypes] = useState([
    { id: "building", name: "Building", description: "Main facility or structure", color: "#059669" },
    { id: "room", name: "Room", description: "Individual room or area", color: "#0ea5e9" },
    { id: "cabinet", name: "Cabinet", description: "Storage cabinet or locker", color: "#8b5cf6" },
    { id: "shelf", name: "Shelf", description: "Individual shelf or compartment", color: "#f59e0b" },
    { id: "container", name: "Container", description: "Portable storage container", color: "#ef4444" },
  ])

  const [dailyCheckItems, setDailyCheckItems] = useState([
    // Exterior Checks
    { id: "ext-1", category: "Exterior", item: "Body damage inspection", required: true },
    { id: "ext-2", category: "Exterior", item: "Lights (headlights, taillights, emergency)", required: true },
    { id: "ext-3", category: "Exterior", item: "Tires condition and pressure", required: true },
    { id: "ext-4", category: "Exterior", item: "Mirrors and windows", required: true },
    { id: "ext-5", category: "Exterior", item: "License plates and registration", required: false },

    // Interior Checks
    { id: "int-1", category: "Interior", item: "Seat belts and restraints", required: true },
    { id: "int-2", category: "Interior", item: "Dashboard warning lights", required: true },
    { id: "int-3", category: "Interior", item: "Radio and communication equipment", required: true },
    { id: "int-4", category: "Interior", item: "Air conditioning/heating", required: false },
    { id: "int-5", category: "Interior", item: "Interior cleanliness", required: false },

    // Engine/Mechanical
    { id: "mech-1", category: "Mechanical", item: "Engine oil level", required: true },
    { id: "mech-2", category: "Mechanical", item: "Coolant level", required: true },
    { id: "mech-3", category: "Mechanical", item: "Brake fluid level", required: true },
    { id: "mech-4", category: "Mechanical", item: "Battery condition", required: true },
    { id: "mech-5", category: "Mechanical", item: "Unusual noises or vibrations", required: true },

    // Medical Equipment
    { id: "med-1", category: "Medical Equipment", item: "Oxygen tanks (15L) - quantity and pressure", required: true },
    { id: "med-2", category: "Medical Equipment", item: "Defibrillator (charged and functional)", required: true },
    { id: "med-3", category: "Medical Equipment", item: "Cardiac monitor and leads", required: true },
    { id: "med-4", category: "Medical Equipment", item: "Stretcher operation and restraints", required: true },
    { id: "med-5", category: "Medical Equipment", item: "Suction unit functionality", required: true },
    { id: "med-6", category: "Medical Equipment", item: "Blood pressure cuffs (adult/pediatric)", required: true },
    { id: "med-7", category: "Medical Equipment", item: "Pulse oximeter", required: true },

    // Medical Supplies
    {
      id: "sup-1",
      category: "Medical Supplies",
      item: "Emergency medications (epinephrine, albuterol, etc.)",
      required: true,
    },
    { id: "sup-2", category: "Medical Supplies", item: "IV supplies and fluids", required: true },
    { id: "sup-3", category: "Medical Supplies", item: "Bandages and wound care supplies", required: true },
    { id: "sup-4", category: "Medical Supplies", item: "Airway management supplies (intubation kit)", required: true },
    { id: "sup-5", category: "Medical Supplies", item: "Splinting materials", required: true },
    { id: "sup-6", category: "Medical Supplies", item: "Burn treatment supplies", required: true },
    { id: "sup-7", category: "Medical Supplies", item: "Obstetric kit", required: false },
    { id: "sup-8", category: "Medical Supplies", item: "Pediatric supplies", required: true },

    // Safety Equipment
    { id: "safe-1", category: "Safety", item: "Fire extinguisher", required: true },
    { id: "safe-2", category: "Safety", item: "First aid kit", required: true },
    { id: "safe-3", category: "Safety", item: "Emergency triangles/flares", required: true },
    { id: "safe-4", category: "Safety", item: "Personal protective equipment (gloves, masks, gowns)", required: true },
    { id: "safe-5", category: "Safety", item: "Emergency contact information", required: true },
    { id: "safe-6", category: "Safety", item: "Spill cleanup kit", required: false },
  ])

  const [newLocationType, setNewLocationType] = useState({
    name: "",
    description: "",
    color: "#059669",
  })
  const [showAddLocationTypeForm, setShowAddLocationTypeForm] = useState(false)

  const [newCheckItem, setNewCheckItem] = useState({
    category: "",
    item: "",
    required: true,
  })
  const [showAddCheckItemForm, setShowAddCheckItemForm] = useState(false)

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!", {
      description: "All your configuration changes have been applied.",
    })
    console.log("Saving settings:", { generalSettings, systemPreferences, businessRules })
  }

  const handleResetToDefaults = () => {
    setGeneralSettings({
      organizationName: "Emergency Medical Services",
      timezone: "America/New_York",
      language: "en",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
    })
    setSystemPreferences({
      darkMode: false,
      notifications: true,
      autoSave: true,
      compactView: false,
      showTutorials: true,
    })
    toast.info("Settings reset to defaults", {
      description: "All settings have been restored to their default values.",
    })
  }

  const handleGeneralSettingChange = (key: string, value: string) => {
    setGeneralSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSystemPreferenceChange = (key: string, value: boolean) => {
    setSystemPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handleBusinessRuleChange = (category: string, key: string, value: any) => {
    setBusinessRules((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }))
  }

  const handleAddLocationType = () => {
    if (!newLocationType.name.trim()) {
      toast.error("Please enter a location type name")
      return
    }

    const newType = {
      id: newLocationType.name.toLowerCase().replace(/\s+/g, "-"),
      name: newLocationType.name,
      description: newLocationType.description,
      color: newLocationType.color,
    }

    setLocationTypes([...locationTypes, newType])
    setNewLocationType({ name: "", description: "", color: "#059669" })
    setShowAddLocationTypeForm(false)
    toast.success("Location type added successfully!")
  }

  const handleRemoveLocationType = (typeId: string) => {
    setLocationTypes(locationTypes.filter((type) => type.id !== typeId))
    toast.success("Location type removed successfully!")
  }

  const handleExportSettings = () => {
    const settingsData = {
      general: generalSettings,
      preferences: systemPreferences,
      businessRules,
      locationTypes,
    }

    const dataStr = JSON.stringify(settingsData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "ambusupply-settings.json"
    link.click()

    toast.success("Settings exported successfully!")
  }

  const handleImportSettings = () => {
    toast.info("Import Settings", {
      description: "File import functionality will be available soon.",
    })
  }

  const handleAddCheckItem = () => {
    if (!newCheckItem.category.trim() || !newCheckItem.item.trim()) {
      toast.error("Please enter both category and item description")
      return
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      category: newCheckItem.category,
      item: newCheckItem.item,
      required: newCheckItem.required,
    }

    setDailyCheckItems([...dailyCheckItems, newItem])
    setNewCheckItem({ category: "", item: "", required: true })
    setShowAddCheckItemForm(false)
    toast.success("Daily check item added successfully!")
  }

  const handleRemoveCheckItem = (itemId: string) => {
    setDailyCheckItems(dailyCheckItems.filter((item) => item.id !== itemId))
    toast.success("Daily check item removed successfully!")
  }

  const handleUpdateCheckItem = (itemId: string, field: string, value: any) => {
    setDailyCheckItems(dailyCheckItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your AmbuSupply system preferences</p>
          </div>
          <div className="flex items-center space-x-3 bg-muted/50 p-1 rounded-lg">
            <Label htmlFor="advanced-mode" className="text-sm font-medium">
              Simple
            </Label>
            <Switch id="advanced-mode" checked={isAdvancedMode} onCheckedChange={setIsAdvancedMode} />
            <Label htmlFor="advanced-mode" className="text-sm font-medium">
              Advanced
            </Label>
          </div>
        </div>

        {!isAdvancedMode ? (
          // Simple Settings View
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Setup</CardTitle>
                <CardDescription>Essential settings to get started with AmbuSupply</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={generalSettings.organizationName}
                      onChange={(e) => handleGeneralSettingChange("organizationName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={generalSettings.timezone}
                      onValueChange={(value) => handleGeneralSettingChange("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts for critical events</p>
                    </div>
                    <Switch
                      checked={systemPreferences.notifications}
                      onCheckedChange={(checked) => handleSystemPreferenceChange("notifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-save Changes</Label>
                      <p className="text-sm text-muted-foreground">Automatically save your work</p>
                    </div>
                    <Switch
                      checked={systemPreferences.autoSave}
                      onCheckedChange={(checked) => handleSystemPreferenceChange("autoSave", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleResetToDefaults}>
                    Reset to Defaults
                  </Button>
                  <Button onClick={handleSaveSettings}>Save Settings</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need More Options?</CardTitle>
                <CardDescription>Switch to advanced mode for complete system configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAdvancedMode(true)} className="w-full">
                  Switch to Advanced Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Advanced Settings View (existing comprehensive settings)
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data-structures">Data</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="ui-layout">UI Layout</TabsTrigger>
              <TabsTrigger value="business-rules">Business Rules</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Organization Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name-adv">Organization Name</Label>
                      <Input
                        id="org-name-adv"
                        value={generalSettings.organizationName}
                        onChange={(e) => handleGeneralSettingChange("organizationName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone-adv">Timezone</Label>
                      <Select
                        value={generalSettings.timezone}
                        onValueChange={(value) => handleGeneralSettingChange("timezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleExportSettings}>
                      Export Settings
                    </Button>
                    <Button variant="outline" onClick={handleImportSettings}>
                      Import Settings
                    </Button>
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Structures Tab */}
            <TabsContent value="data-structures" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Location Types</span>
                    <Button variant="outline" size="sm" onClick={() => setShowAddLocationTypeForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Type
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Define the types of locations that can be created in the location hierarchy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAddLocationTypeForm && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type-name">Type Name</Label>
                          <Input
                            id="type-name"
                            value={newLocationType.name}
                            onChange={(e) => setNewLocationType({ ...newLocationType, name: e.target.value })}
                            placeholder="e.g., Warehouse, Freezer, Vehicle"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type-color">Color</Label>
                          <Input
                            id="type-color"
                            type="color"
                            value={newLocationType.color}
                            onChange={(e) => setNewLocationType({ ...newLocationType, color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type-description">Description</Label>
                        <Input
                          id="type-description"
                          value={newLocationType.description}
                          onChange={(e) => setNewLocationType({ ...newLocationType, description: e.target.value })}
                          placeholder="Brief description of this location type"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddLocationType} size="sm">
                          Add Type
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddLocationTypeForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locationTypes.map((type) => (
                      <div key={type.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }} />
                            <span className="font-medium">{type.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleRemoveLocationType(type.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Check Items customization card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Daily Check Items</span>
                    <Button variant="outline" size="sm" onClick={() => setShowAddCheckItemForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Customize the daily vehicle inspection checklist including medical supplies and equipment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAddCheckItemForm && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="check-category">Category</Label>
                          <Select
                            value={newCheckItem.category}
                            onValueChange={(value) => setNewCheckItem({ ...newCheckItem, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select or type category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Exterior">Exterior</SelectItem>
                              <SelectItem value="Interior">Interior</SelectItem>
                              <SelectItem value="Mechanical">Mechanical</SelectItem>
                              <SelectItem value="Medical Equipment">Medical Equipment</SelectItem>
                              <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                              <SelectItem value="Safety">Safety</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Required Check</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch
                              checked={newCheckItem.required}
                              onCheckedChange={(checked) => setNewCheckItem({ ...newCheckItem, required: checked })}
                            />
                            <span className="text-sm text-muted-foreground">
                              {newCheckItem.required ? "Required" : "Optional"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="check-item">Check Item Description</Label>
                        <Input
                          id="check-item"
                          value={newCheckItem.item}
                          onChange={(e) => setNewCheckItem({ ...newCheckItem, item: e.target.value })}
                          placeholder="e.g., Oxygen tanks (15L) - quantity and pressure"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddCheckItem} size="sm">
                          Add Item
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAddCheckItemForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {Object.entries(
                      dailyCheckItems.reduce(
                        (acc, item) => {
                          if (!acc[item.category]) acc[item.category] = []
                          acc[item.category].push(item)
                          return acc
                        },
                        {} as Record<string, typeof dailyCheckItems>,
                      ),
                    ).map(([category, items]) => (
                      <div key={category} className="border rounded-lg p-4">
                        <h4 className="font-medium text-lg mb-3 text-primary">{category}</h4>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div className="flex-1">
                                <Input
                                  value={item.item}
                                  onChange={(e) => handleUpdateCheckItem(item.id, "item", e.target.value)}
                                  className="border-none bg-transparent p-0 h-auto font-medium"
                                />
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Switch
                                  checked={item.required}
                                  onCheckedChange={(checked) => handleUpdateCheckItem(item.id, "required", checked)}
                                />
                                <span className="text-xs text-muted-foreground min-w-[60px]">
                                  {item.required ? "Required" : "Optional"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleRemoveCheckItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Placeholder tabs for other sections */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Configure user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">User management features coming soon...</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Configuration</CardTitle>
                  <CardDescription>Configure notification and alert settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Alert configuration features coming soon...</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security policies and access controls</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Security settings features coming soon...</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Customization</CardTitle>
                  <CardDescription>Customize the visual appearance of your system</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Appearance customization features coming soon...</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Configuration</CardTitle>
                  <CardDescription>Configure business process workflows</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Workflow configuration features coming soon...</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ui-layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>UI Layout Customization</CardTitle>
                  <CardDescription>Customize the user interface layout and organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">UI layout customization features coming soon...</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business-rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Rules Configuration</CardTitle>
                  <CardDescription>Configure business logic and operational rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Inventory Rules</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Auto-reorder Threshold (%)</Label>
                        <Input
                          type="number"
                          value={businessRules.inventory.reorderThreshold}
                          onChange={(e) =>
                            handleBusinessRuleChange("inventory", "reorderThreshold", Number.parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Order Quantity</Label>
                        <Input
                          type="number"
                          value={businessRules.inventory.maxOrderQuantity}
                          onChange={(e) =>
                            handleBusinessRuleChange("inventory", "maxOrderQuantity", Number.parseInt(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
