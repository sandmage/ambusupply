"use client"

import { useState } from "react"
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
    if (!organization || profile?.role !== "admin") return

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
      // Mark setup as incomplete to allow re-running
      const { error } = await supabase.from("profiles").update({ setup_completed: false }).eq("id", user.id)

      if (error) throw error

      showMessage("Setup wizard reset successfully")
      setTimeout(() => {
        router.push("/setup")
      }, 1000)
    } catch (error: any) {
      showMessage(error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account, organization, and system preferences</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${message.includes("error") || message.includes("Error") ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700"}`}
        >
          {message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2" disabled={profile?.role !== "admin"}>
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profileData.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={profile?.role === "admin" ? "default" : "secondary"}>{profile?.role || "staff"}</Badge>
                <span className="text-sm text-muted-foreground">Current Role</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={profileData.current_password}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, current_password: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={profileData.new_password}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, new_password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={profileData.confirm_password}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Setup</CardTitle>
              <CardDescription>Re-run the initial organization setup wizard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Setup Wizard</Label>
                  <p className="text-sm text-muted-foreground">
                    Re-configure your organization settings and preferences
                  </p>
                </div>
                <Button onClick={handleRerunSetup} disabled={loading} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  {loading ? "Resetting..." : "Re-run Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
            <Button onClick={handleProfileUpdate} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          {profile?.role === "admin" ? (
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Manage your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org_name">Organization Name</Label>
                    <Input
                      id="org_name"
                      value={organizationData.name}
                      onChange={(e) => setOrganizationData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_type">Organization Type</Label>
                    <Select
                      value={organizationData.organization_type}
                      onValueChange={(value) => setOrganizationData((prev) => ({ ...prev, organization_type: value }))}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_address">Address</Label>
                  <Input
                    id="org_address"
                    value={organizationData.address}
                    onChange={(e) => setOrganizationData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org_phone">Phone</Label>
                    <Input
                      id="org_phone"
                      value={organizationData.phone}
                      onChange={(e) => setOrganizationData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_email">Email</Label>
                    <Input
                      id="org_email"
                      type="email"
                      value={organizationData.email}
                      onChange={(e) => setOrganizationData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={organizationData.license_number}
                    onChange={(e) => setOrganizationData((prev) => ({ ...prev, license_number: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleOrganizationUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Update Organization"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                  <p className="text-muted-foreground">Only administrators can modify organization settings.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Preferences</CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Inventory Preferences</CardTitle>
              <CardDescription>Configure default inventory management settings</CardDescription>
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
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export your inventory data for backup or analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={() => handleDataExport("csv")} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button onClick={() => handleDataExport("json")} disabled={loading} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Export includes all inventory items, locations, and transaction history
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>Database backup and system maintenance options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Database Backup</p>
                  <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
                </div>
                <Button variant="outline" disabled={profile?.role !== "admin"}>
                  <Database className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Maintenance</p>
                  <p className="text-sm text-muted-foreground">Next scheduled: Sunday 2:00 AM</p>
                </div>
                <Button variant="outline" disabled={profile?.role !== "admin"}>
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
