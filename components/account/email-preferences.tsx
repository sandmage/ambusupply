"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Mail, AlertTriangle, CheckCircle } from "@/components/ui/icons"

interface EmailPreferences {
  id: string
  enableEmailNotifications: boolean
  lowStockAlerts: boolean
  maintenanceAlerts: boolean
  orderNotifications: boolean
  medicationAlerts: boolean
  emergencyAlerts: boolean
  systemNotifications: boolean
  urgentOnly: boolean
  highPriorityOnly: boolean
  digestMode: boolean
  digestFrequency: "DAILY" | "WEEKLY" | "NEVER"
}

export function EmailPreferences() {
  const { user } = useAuthStore()
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchPreferences()
    }
  }, [user?.id])

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`/api/users/${user?.id}/email-preferences`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error("Failed to fetch email preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<EmailPreferences>) => {
    if (!preferences) return

    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)

    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${user?.id}/email-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        setIsSuccess(true)
        setMessage("Email preferences updated successfully")
      } else {
        setIsSuccess(false)
        setMessage("Failed to update preferences")
      }
    } catch (error) {
      console.error("Failed to update email preferences:", error)
      setIsSuccess(false)
      setMessage("An error occurred while updating preferences")
    } finally {
      setIsSaving(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>Failed to load email preferences. Please try again.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>Control which notifications you receive via email</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {message && (
          <Alert className={isSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription className={isSuccess ? "text-green-800" : "text-red-800"}>{message}</AlertDescription>
          </Alert>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Email Notifications</Label>
            <p className="text-sm text-gray-600">Enable or disable all email notifications</p>
          </div>
          <Switch
            checked={preferences.enableEmailNotifications}
            onCheckedChange={(checked) => updatePreferences({ enableEmailNotifications: checked })}
            disabled={isSaving}
          />
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Notification Types</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-gray-600">When inventory items are running low</p>
              </div>
              <Switch
                checked={preferences.lowStockAlerts}
                onCheckedChange={(checked) => updatePreferences({ lowStockAlerts: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Maintenance Alerts</Label>
                <p className="text-sm text-gray-600">Vehicle maintenance due notifications</p>
              </div>
              <Switch
                checked={preferences.maintenanceAlerts}
                onCheckedChange={(checked) => updatePreferences({ maintenanceAlerts: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Order Notifications</Label>
                <p className="text-sm text-gray-600">Order status updates and approvals</p>
              </div>
              <Switch
                checked={preferences.orderNotifications}
                onCheckedChange={(checked) => updatePreferences({ orderNotifications: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Medication Alerts</Label>
                <p className="text-sm text-gray-600">Medication expiry and stock alerts</p>
              </div>
              <Switch
                checked={preferences.medicationAlerts}
                onCheckedChange={(checked) => updatePreferences({ medicationAlerts: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Emergency Alerts</Label>
                <p className="text-sm text-gray-600">Critical system and emergency notifications</p>
              </div>
              <Switch
                checked={preferences.emergencyAlerts}
                onCheckedChange={(checked) => updatePreferences({ emergencyAlerts: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>System Notifications</Label>
                <p className="text-sm text-gray-600">System updates and maintenance notices</p>
              </div>
              <Switch
                checked={preferences.systemNotifications}
                onCheckedChange={(checked) => updatePreferences({ systemNotifications: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Priority Filters */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Priority Filters</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Urgent Only</Label>
                <p className="text-sm text-gray-600">Only receive urgent priority notifications</p>
              </div>
              <Switch
                checked={preferences.urgentOnly}
                onCheckedChange={(checked) => updatePreferences({ urgentOnly: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>High Priority Only</Label>
                <p className="text-sm text-gray-600">Only receive high and urgent priority notifications</p>
              </div>
              <Switch
                checked={preferences.highPriorityOnly}
                onCheckedChange={(checked) => updatePreferences({ highPriorityOnly: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications || preferences.urgentOnly}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Delivery Options */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Delivery Options</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Digest Mode</Label>
                <p className="text-sm text-gray-600">Group notifications into periodic summaries</p>
              </div>
              <Switch
                checked={preferences.digestMode}
                onCheckedChange={(checked) => updatePreferences({ digestMode: checked })}
                disabled={isSaving || !preferences.enableEmailNotifications}
              />
            </div>

            {preferences.digestMode && (
              <div className="space-y-2">
                <Label>Digest Frequency</Label>
                <Select
                  value={preferences.digestFrequency}
                  onValueChange={(value: "DAILY" | "WEEKLY" | "NEVER") => updatePreferences({ digestFrequency: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="NEVER">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
