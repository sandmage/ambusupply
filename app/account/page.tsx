"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, MapPin, Bell, Shield, Key } from "@/components/ui/icons"
import { useAuthStore } from "@/lib/stores/auth-store"
import { EmailPreferences } from "@/components/account/email-preferences"
import { toast } from "sonner"

export default function AccountPage() {
  const { user } = useAuthStore()

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "Admin",
    lastName: user?.lastName || "User",
    email: user?.email || "admin@metroems.com",
    phone: "+1 (555) 123-4567",
    address: "123 Emergency Services Blvd, Medical City, MC 12345",
    role: user?.role || "ADMIN",
    department: "Emergency Medical Services",
    employeeId: "EMS-001",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    inventoryAlerts: true,
    fleetAlerts: true,
    orderUpdates: true,
    systemMaintenance: false,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "8h",
    loginNotifications: true,
  })

  const handleProfileUpdate = () => {
    toast.success("Profile updated successfully!", {
      description: "Your account information has been saved.",
    })
  }

  const handleNotificationUpdate = () => {
    toast.success("Notification preferences updated!", {
      description: "Your notification settings have been saved.",
    })
  }

  const handleSecurityUpdate = () => {
    toast.success("Security settings updated!", {
      description: "Your security preferences have been saved.",
    })
  }

  const handlePasswordChange = () => {
    toast.info("Password Change", {
      description: "Password change functionality will be available soon.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your personal account and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="/placeholder.svg" alt={`${profileData.firstName} ${profileData.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {profileData.firstName[0]}
                  {profileData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <CardTitle>
                {profileData.firstName} {profileData.lastName}
              </CardTitle>
              <CardDescription>
                {profileData.role} • {profileData.department}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profileData.phone}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">{profileData.address}</span>
              </div>
              <Button variant="outline" className="w-full bg-transparent" onClick={handlePasswordChange}>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>Update your personal information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate}>Update Profile</Button>
                </div>
              </CardContent>
            </Card>

            <EmailPreferences />

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>In-App Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose how you want to receive in-app notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inventory Alerts</Label>
                      <p className="text-sm text-muted-foreground">Low stock and expiration alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.inventoryAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, inventoryAlerts: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Fleet Alerts</Label>
                      <p className="text-sm text-muted-foreground">Vehicle maintenance and deployment alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.fleetAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, fleetAlerts: checked })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNotificationUpdate}>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>Manage your account security and privacy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Login Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                    </div>
                    <Switch
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({ ...securitySettings, loginNotifications: checked })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select
                      value={securitySettings.sessionTimeout}
                      onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="4h">4 hours</SelectItem>
                        <SelectItem value="8h">8 hours</SelectItem>
                        <SelectItem value="24h">24 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSecurityUpdate}>Update Security</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
