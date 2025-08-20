"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Building2, Shield, Bell, Database, Download, Clock, AlertTriangle, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface SettingsClientProps {
  user: any
  profile: any
  organization: any
}

export function SettingsClient({ user, profile, organization }: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("profile")
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [organizationData, setOrganizationData] = useState({
    name: organization?.name || "",
    organization_type: organization?.organization_type || "",
    address: organization?.address || "",
    phone: organization?.phone || "",
    email: organization?.email || "",
    license_number: organization?.license_number || "",
  })

  const [systemSettings, setSystemSettings] = useState({
    auto_refresh: true,
    email_notifications: true,
    audit_logging: false,
    default_par_level: 10,
    expiration_warning_days: 30,
    low_stock_threshold: 20,
    session_timeout: 60,
    require_password_reset: false,
    two_factor_auth: true,
  })

  const [storageUnitTypes, setStorageUnitTypes] = useState<any[]>([])
  const [editingStorageType, setEditingStorageType] = useState<any>(null)
  const [storageTypeForm, setStorageTypeForm] = useState({
    name: "",
    description: "",
    capacity_type: "items",
    default_capacity: 0,
  })

  const [currentProfile, setCurrentProfile] = useState(profile)
  const [profileLoading, setProfileLoading] = useState(!profile)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!profile && user?.id) {
        console.log("[v0] Profile not provided, fetching from database...")
        setProfileLoading(true)
        try {
          const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          if (error) {
            console.log("[v0] Profile fetch error:", error)
            if (error.code === "PGRST116") {
              // Profile doesn't exist, create one
              console.log("[v0] Creating new profile for user...")
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: user.id,
                    email: user.email,
                    role: "admin", // Default to admin for now
                    organization_id: organization?.id || null,
                  },
                ])
                .select()
                .single()

              if (createError) {
                console.error("[v0] Error creating profile:", createError)
                showMessage("Error creating user profile. Please contact support.", "error")
              } else {
                console.log("[v0] New profile created:", newProfile)
                setCurrentProfile(newProfile)
              }
            }
          } else {
            console.log("[v0] Profile fetched successfully:", profileData)
            setCurrentProfile(profileData)
          }
        } catch (error) {
          console.error("[v0] Error in profile fetch:", error)
          showMessage("Error loading user profile", "error")
        } finally {
          setProfileLoading(false)
        }
      } else {
        setCurrentProfile(profile)
        setProfileLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, profile, organization, supabase])

  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    setMessage(msg)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleProfileUpdate = async () => {
    setSaving(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update password if provided
      if (profileData.new_password && profileData.new_password === profileData.confirm_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.new_password,
        })
        if (passwordError) throw passwordError
      }

      showMessage("Profile updated successfully")
      setProfileData((prev) => ({ ...prev, current_password: "", new_password: "", confirm_password: "" }))
      router.refresh()
    } catch (error: any) {
      showMessage(error.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleOrganizationUpdate = async () => {
    if (!organization || currentProfile?.role !== "admin") return

    setSaving(true)
    try {
      const { error } = await supabase.from("organizations").update(organizationData).eq("id", organization.id)

      if (error) throw error

      showMessage("Organization settings updated successfully")
      router.refresh()
    } catch (error: any) {
      showMessage(error.message, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDataExport = async (format: "csv" | "json") => {
    setLoading(true)
    try {
      // Export inventory data
      const { data: inventoryData, error } = await supabase.from("inventory_items").select(`
          *,
          locations(name),
          storage_units(name)
        `)

      if (error) throw error

      const dataStr = format === "json" ? JSON.stringify(inventoryData, null, 2) : convertToCSV(inventoryData)

      const blob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `inventory_export_${new Date().toISOString().split("T")[0]}.${format}`
      link.click()
      URL.revokeObjectURL(url)

      showMessage(`Data exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      showMessage(error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ""
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    return [headers, ...rows].join("\n")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleRerunSetup = async () => {
    setLoading(true)
    try {
      router.push(`/setup?rerun=true`)
    } catch (error: any) {
      showMessage(error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchStorageUnitTypes = async () => {
    try {
      if (!currentProfile?.organization_id) {
        console.log("No organization_id available")
        setStorageUnitTypes([])
        return
      }

      const { data, error } = await supabase
        .from("storage_unit_types")
        .select("*")
        .eq("organization_id", currentProfile.organization_id)
        .order("name")

      if (error) {
        throw error
      }

      setStorageUnitTypes(data || [])
    } catch (error: any) {
      console.error("Error fetching storage unit types:", error)
      if (error.message.includes("schema cache")) {
        showMessage("Database table not found. Please run the required database migration.", "error")
      } else {
        showMessage(`Error loading storage unit types: ${error.message}`, "error")
      }
      setStorageUnitTypes([])
    }
  }

  const handleStorageTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] User profile data:", currentProfile)
    console.log("[v0] User role:", currentProfile?.role)
    console.log("[v0] User organization_id:", currentProfile?.organization_id)
    console.log("[v0] Is admin check:", currentProfile?.role === "admin")

    if (currentProfile?.role !== "admin") {
      console.log("[v0] Permission denied - user role is not admin")
      showMessage("Only administrators can manage storage unit types", "error")
      return
    }

    if (!currentProfile?.organization_id) {
      console.log("[v0] No organization_id available")
      showMessage("No organization associated with your account", "error")
      return
    }

    setSaving(true)
    try {
      console.log("[v0] Proceeding with storage type operation...")

      const storageTypeData = {
        ...storageTypeForm,
        organization_id: currentProfile.organization_id,
      }

      console.log("[v0] Storage type data to submit:", storageTypeData)

      if (editingStorageType) {
        const { error } = await supabase
          .from("storage_unit_types")
          .update(storageTypeData)
          .eq("id", editingStorageType.id)
          .eq("organization_id", currentProfile.organization_id)

        if (error) throw error
        showMessage("Storage unit type updated successfully")
      } else {
        const { error } = await supabase.from("storage_unit_types").insert([storageTypeData])

        if (error) throw error
        showMessage("Storage unit type created successfully")
      }

      setStorageTypeForm({ name: "", description: "", capacity_type: "items", default_capacity: 0 })
      setEditingStorageType(null)
      fetchStorageUnitTypes()
    } catch (error: any) {
      console.error("[v0] Storage unit type operation error:", error.message)
      console.log("[v0] Error details:", error.message, error.code, error.details)
      showMessage(`Error: ${error.message}`, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStorageType = async (id: string) => {
    if (currentProfile?.role !== "admin") {
      showMessage("Only administrators can delete storage unit types", "error")
      return
    }

    if (!confirm("Are you sure you want to delete this storage unit type?")) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("storage_unit_types")
        .delete()
        .eq("id", id)
        .eq("organization_id", currentProfile.organization_id)

      if (error) throw error
      showMessage("Storage unit type deleted successfully")
      fetchStorageUnitTypes()
    } catch (error: any) {
      console.error("Delete storage unit type error:", error)
      showMessage(`Error: ${error.message}`, "error")
    } finally {
      setSaving(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "inventory") {
      fetchStorageUnitTypes()
    }
  }

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary mb-2">Settings</h1>
        <p className="text-lg text-muted-foreground font-medium">
          Manage your account, organization, and system preferences
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl mb-6 ${
            message.includes("error") || message.includes("Error")
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <p className="font-medium">{message}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="bg-card border border-border/50 rounded-2xl p-2 shadow-sm">
          <TabsTrigger value="profile" className="flex items-center gap-2 rounded-xl font-medium">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="organization"
            className="flex items-center gap-2 rounded-xl font-medium"
            disabled={currentProfile?.role !== "admin"}
          >
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 rounded-xl font-medium">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 rounded-xl font-medium">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2 rounded-xl font-medium">
            <Database className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2 rounded-xl font-medium">
            <Download className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-8">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Profile Information</CardTitle>
              <CardDescription className="text-base font-medium">
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="full_name" className="text-base font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="h-12 rounded-2xl border-border/50 bg-muted text-base"
                  />
                  <p className="text-sm text-muted-foreground font-medium">Email cannot be changed</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-base font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="h-12 rounded-2xl border-border/50 bg-card text-base"
                />
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant={currentProfile?.role === "admin" ? "default" : "secondary"}
                  className="text-sm font-medium px-3 py-1 rounded-xl"
                >
                  {currentProfile?.role || "staff"}
                </Badge>
                <span className="text-base text-muted-foreground font-medium">Current Role</span>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Change Password</CardTitle>
              <CardDescription className="text-base font-medium">Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="current_password" className="text-base font-medium">
                  Current Password
                </Label>
                <Input
                  id="current_password"
                  type="password"
                  value={profileData.current_password}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, current_password: e.target.value }))}
                  className="h-12 rounded-2xl border-border/50 bg-card text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="new_password" className="text-base font-medium">
                    New Password
                  </Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={profileData.new_password}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, new_password: e.target.value }))}
                    className="h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="confirm_password" className="text-base font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={profileData.confirm_password}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, confirm_password: e.target.value }))}
                    className="h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Organization Setup</CardTitle>
              <CardDescription className="text-base font-medium">
                Re-run the initial organization setup wizard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Setup Wizard</Label>
                  <p className="text-base text-muted-foreground font-medium">
                    Re-configure your organization settings and preferences
                  </p>
                </div>
                <Button
                  onClick={handleRerunSetup}
                  disabled={loading}
                  variant="outline"
                  className="apple-button-secondary bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {loading ? "Resetting..." : "Re-run Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-12 px-6 rounded-2xl border-border/50 bg-transparent"
            >
              Sign Out
            </Button>
            <Button onClick={handleProfileUpdate} disabled={saving} className="apple-button h-12 px-6">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-8">
          {currentProfile?.role === "admin" ? (
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-2xl font-serif font-bold text-primary">Organization Details</CardTitle>
                <CardDescription className="text-base font-medium">
                  Manage your organization information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="org_name" className="text-base font-medium">
                      Organization Name
                    </Label>
                    <Input
                      id="org_name"
                      value={organizationData.name}
                      onChange={(e) => setOrganizationData((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="org_type" className="text-base font-medium">
                      Organization Type
                    </Label>
                    <Select
                      value={organizationData.organization_type}
                      onValueChange={(value) => setOrganizationData((prev) => ({ ...prev, organization_type: value }))}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/50">
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="ems">EMS Service</SelectItem>
                        <SelectItem value="fire_department">Fire Department</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="org_address" className="text-base font-medium">
                    Address
                  </Label>
                  <Input
                    id="org_address"
                    value={organizationData.address}
                    onChange={(e) => setOrganizationData((prev) => ({ ...prev, address: e.target.value }))}
                    className="h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="org_phone" className="text-base font-medium">
                      Phone
                    </Label>
                    <Input
                      id="org_phone"
                      value={organizationData.phone}
                      onChange={(e) => setOrganizationData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="org_email" className="text-base font-medium">
                      Email
                    </Label>
                    <Input
                      id="org_email"
                      type="email"
                      value={organizationData.email}
                      onChange={(e) => setOrganizationData((prev) => ({ ...prev, email: e.target.value }))}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="license_number" className="text-base font-medium">
                    License Number
                  </Label>
                  <Input
                    id="license_number"
                    value={organizationData.license_number}
                    onChange={(e) => setOrganizationData((prev) => ({ ...prev, license_number: e.target.value }))}
                    className="h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleOrganizationUpdate} disabled={saving} className="apple-button h-12 px-6">
                    {saving ? "Saving..." : "Update Organization"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="apple-card">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="p-4 rounded-3xl bg-orange-100 inline-flex mb-6">
                    <AlertTriangle className="h-12 w-12 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-3 text-primary">Admin Access Required</h3>
                  <p className="text-base text-muted-foreground font-medium">
                    Only administrators can modify organization settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Security Preferences</CardTitle>
              <CardDescription className="text-base font-medium">
                Configure security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={systemSettings.two_factor_auth}
                  onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, two_factor_auth: checked }))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout</Label>
                <Select
                  value={systemSettings.session_timeout.toString()}
                  onValueChange={(value) =>
                    setSystemSettings((prev) => ({ ...prev, session_timeout: Number.parseInt(value) }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Automatically sign out after period of inactivity</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Require Password Reset</Label>
                  <p className="text-sm text-muted-foreground">Force password change every 90 days</p>
                </div>
                <Switch
                  checked={systemSettings.require_password_reset}
                  onCheckedChange={(checked) =>
                    setSystemSettings((prev) => ({ ...prev, require_password_reset: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Notification Preferences</CardTitle>
              <CardDescription className="text-base font-medium">
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts via email for critical events</p>
                </div>
                <Switch
                  checked={systemSettings.email_notifications}
                  onCheckedChange={(checked) =>
                    setSystemSettings((prev) => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-refresh Dashboard</Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh data every 30 seconds</p>
                </div>
                <Switch
                  checked={systemSettings.auto_refresh}
                  onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, auto_refresh: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Track all user actions and system changes</p>
                </div>
                <Switch
                  checked={systemSettings.audit_logging}
                  onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, audit_logging: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Settings */}
        <TabsContent value="inventory" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Inventory Preferences</CardTitle>
              <CardDescription className="text-base font-medium">
                Configure default inventory management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_par">Default PAR Level</Label>
                  <Input
                    id="default_par"
                    type="number"
                    value={systemSettings.default_par_level}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        default_par_level: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Default minimum stock level for new items</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration_warning">Expiration Warning (Days)</Label>
                  <Input
                    id="expiration_warning"
                    type="number"
                    value={systemSettings.expiration_warning_days}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        expiration_warning_days: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Days before expiration to show warnings</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock">Low Stock Threshold (%)</Label>
                  <Input
                    id="low_stock"
                    type="number"
                    value={systemSettings.low_stock_threshold}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        low_stock_threshold: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Percentage of PAR level to trigger alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Storage Unit Types</CardTitle>
              <CardDescription className="text-base font-medium">
                Create and manage storage unit types for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Storage Unit Type Form */}
              <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
                <h4 className="text-lg font-semibold mb-4">
                  {editingStorageType ? "Edit Storage Unit Type" : "Add New Storage Unit Type"}
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="storage_type_name">Name</Label>
                    <Input
                      id="storage_type_name"
                      value={storageTypeForm.name}
                      onChange={(e) => setStorageTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cabinet, Drawer, Shelf"
                      className="h-12 rounded-2xl border-border/50 bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity_type">Capacity Type</Label>
                    <Select
                      value={storageTypeForm.capacity_type}
                      onValueChange={(value) => setStorageTypeForm((prev) => ({ ...prev, capacity_type: value }))}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/50">
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="volume">Volume (L)</SelectItem>
                        <SelectItem value="weight">Weight (kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="default_capacity">Default Capacity</Label>
                    <Input
                      id="default_capacity"
                      type="number"
                      value={storageTypeForm.default_capacity}
                      onChange={(e) =>
                        setStorageTypeForm((prev) => ({
                          ...prev,
                          default_capacity: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      className="h-12 rounded-2xl border-border/50 bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage_description">Description</Label>
                    <Input
                      id="storage_description"
                      value={storageTypeForm.description}
                      onChange={(e) => setStorageTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                      className="h-12 rounded-2xl border-border/50 bg-card"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleStorageTypeSubmit}
                    disabled={saving || !storageTypeForm.name}
                    className="apple-button h-12 px-6"
                  >
                    {saving ? "Saving..." : editingStorageType ? "Update Type" : "Add Type"}
                  </Button>
                  {editingStorageType && (
                    <Button
                      onClick={() => setEditingStorageType(null)}
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 rounded-xl bg-transparent"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Storage Unit Types List */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Existing Storage Unit Types</h4>
                {storageUnitTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No storage unit types configured yet.</p>
                    <p className="text-sm">Add your first storage unit type above.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {storageUnitTypes.map((storageType) => (
                      <div
                        key={storageType.id}
                        className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h5 className="font-semibold">{storageType.name}</h5>
                            <Badge variant="secondary" className="text-xs">
                              {storageType.capacity_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Capacity: {storageType.default_capacity}</span>
                            {storageType.description && <span>{storageType.description}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingStorageType(storageType)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteStorageType(storageType.id)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl text-destructive hover:text-destructive"
                            disabled={saving}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Data Export</CardTitle>
              <CardDescription className="text-base font-medium">
                Export your inventory data for backup or analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={() => handleDataExport("csv")} disabled={loading} className="apple-button h-12 px-6">
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button
                  onClick={() => handleDataExport("json")}
                  disabled={loading}
                  variant="outline"
                  className="apple-button-secondary h-12 px-6"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Export includes all inventory items, locations, and transaction history
              </p>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-bold text-primary">System Maintenance</CardTitle>
              <CardDescription className="text-base font-medium">
                Database backup and system maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Database Backup</p>
                  <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
                </div>
                <Button
                  variant="outline"
                  disabled={currentProfile?.role !== "admin"}
                  className="apple-button-secondary h-12 px-6 bg-transparent"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Maintenance</p>
                  <p className="text-sm text-muted-foreground">Next scheduled: Sunday 2:00 AM</p>
                </div>
                <Button
                  variant="outline"
                  disabled={currentProfile?.role !== "admin"}
                  className="apple-button-secondary h-12 px-6 bg-transparent"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
