export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-2xl font-bold mt-2">12</p>
          <p className="text-sm text-muted-foreground">Active accounts</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-accent"></div>
            <h3 className="font-medium">Administrators</h3>
          </div>
          <p className="text-2xl font-bold mt-2">3</p>
          <p className="text-sm text-muted-foreground">Admin users</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <h3 className="font-medium">Staff Members</h3>
          </div>
          <p className="text-2xl font-bold mt-2">9</p>
          <p className="text-sm text-muted-foreground">Staff users</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            <h3 className="font-medium">Pending</h3>
          </div>
          <p className="text-2xl font-bold mt-2">2</p>
          <p className="text-sm text-muted-foreground">Awaiting approval</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">System Users</h2>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
              Add User
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">JD</span>
                </div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">john.doe@hospital.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded-full">Admin</span>
                <button className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">SM</span>
                </div>
                <div>
                  <p className="font-medium">Sarah Miller</p>
                  <p className="text-sm text-muted-foreground">sarah.miller@hospital.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Staff</span>
                <button className="text-sm text-muted-foreground hover:text-foreground">Edit</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">MJ</span>
                </div>
                <div>
                  <p className="font-medium">Mike Johnson</p>
                  <p className="text-sm text-muted-foreground">mike.johnson@hospital.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Pending</span>
                <button className="text-sm text-muted-foreground hover:text-foreground">Review</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
