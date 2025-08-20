export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage application settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Settings */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">System Settings</h2>
            <p className="text-sm text-muted-foreground">Configure system-wide preferences</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-refresh Dashboard</p>
                <p className="text-sm text-muted-foreground">Automatically refresh data every 30 seconds</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Send alerts for critical inventory levels</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Audit Logging</p>
                <p className="text-sm text-muted-foreground">Track all user actions and changes</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Inventory Settings</h2>
            <p className="text-sm text-muted-foreground">Configure inventory management preferences</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default PAR Level</label>
              <input type="number" className="w-full px-3 py-2 border rounded-md bg-background" placeholder="10" />
              <p className="text-xs text-muted-foreground mt-1">Default minimum stock level for new items</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expiration Warning (Days)</label>
              <input type="number" className="w-full px-3 py-2 border rounded-md bg-background" placeholder="30" />
              <p className="text-xs text-muted-foreground mt-1">Days before expiration to show warnings</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Low Stock Threshold (%)</label>
              <input type="number" className="w-full px-3 py-2 border rounded-md bg-background" placeholder="20" />
              <p className="text-xs text-muted-foreground mt-1">Percentage of PAR level to trigger low stock alert</p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Security Settings</h2>
            <p className="text-sm text-muted-foreground">Manage security and access controls</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (Minutes)</label>
              <select className="w-full px-3 py-2 border rounded-md bg-background">
                <option>15</option>
                <option>30</option>
                <option>60</option>
                <option>120</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Password Reset</p>
                <p className="text-sm text-muted-foreground">Force password change every 90 days</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Maintenance */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Backup & Maintenance</h2>
            <p className="text-sm text-muted-foreground">System backup and maintenance settings</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="font-medium mb-2">Database Backup</p>
              <div className="flex items-center space-x-2">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">Backup Now</button>
                <span className="text-sm text-muted-foreground">Last backup: 2 hours ago</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">System Maintenance</p>
              <div className="flex items-center space-x-2">
                <button className="border border-input px-4 py-2 rounded-md text-sm hover:bg-accent">
                  Schedule Maintenance
                </button>
                <span className="text-sm text-muted-foreground">Next: Sunday 2:00 AM</span>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Data Export</p>
              <div className="flex items-center space-x-2">
                <button className="border border-input px-4 py-2 rounded-md text-sm hover:bg-accent">
                  Export Data
                </button>
                <span className="text-sm text-muted-foreground">CSV, JSON, PDF formats</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button className="border border-input px-4 py-2 rounded-md text-sm hover:bg-accent">Reset to Defaults</button>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90">
          Save Changes
        </button>
      </div>
    </div>
  )
}
