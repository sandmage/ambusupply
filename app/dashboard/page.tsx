import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/user-management"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  console.log("[v0] Dashboard: Starting dashboard load")

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] Dashboard: User check result:", user ? `User found: ${user.email}` : "No user found")

  if (error || !user) {
    console.log("[v0] Dashboard: No user, redirecting to login")
    redirect("/auth/login")
  }

  console.log("[v0] Dashboard: Querying profile for user ID:", user.id)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record exists

  console.log("[v0] Dashboard: Profile query result:", profile ? "Profile found" : "No profile found")
  if (profileError) {
    console.log("[v0] Dashboard: Profile query error:", profileError)
  }

  const userProfile = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || "staff",
  }

  console.log("[v0] Dashboard: Using profile:", userProfile)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  const isAdmin = userProfile?.role === "admin"
  console.log("[v0] Dashboard: User role:", userProfile?.role, "Is admin:", isAdmin)

  console.log("[v0] Dashboard: Starting database queries")

  let inventoryItems = []
  let locations = []
  let users = []
  let recentTransactions = []

  try {
    const { data: inventoryData } = await supabase
      .from("inventory_items")
      .select("id, current_quantity, par_level, expiration_date")
    inventoryItems = inventoryData || []
  } catch (err) {
    console.log("[v0] Dashboard: Inventory query error:", err)
    inventoryItems = []
  }

  try {
    const { data: locationsData } = await supabase.from("locations").select("id")
    locations = locationsData || []
  } catch (err) {
    console.log("[v0] Dashboard: Locations query error:", err)
    locations = []
  }

  if (isAdmin) {
    try {
      const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      users = usersData || []
    } catch (err) {
      console.log("[v0] Dashboard: Users query error:", err)
      users = []
    }
  }

  try {
    const { data: transactionsData } = await supabase
      .from("transactions")
      .select(`
        id,
        transaction_type,
        quantity_change,
        reason,
        created_at,
        performed_by
      `)
      .order("created_at", { ascending: false })
      .limit(20)
    recentTransactions = transactionsData || []
  } catch (err) {
    console.log("[v0] Dashboard: Transactions query error:", err)
    recentTransactions = []
  }

  console.log("[v0] Dashboard: Database queries completed")
  console.log("[v0] Dashboard: Items:", inventoryItems?.length || 0, "Locations:", locations?.length || 0)

  const totalItems = inventoryItems?.length || 0
  const belowParCount =
    inventoryItems?.filter((item) => item.current_quantity < item.par_level && item.par_level > 0).length || 0

  // Calculate expiring items (within 30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringCount =
    inventoryItems?.filter((item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow)
      .length || 0

  const locationCount = locations?.length || 0
  const userCount = users?.length || 0
  const adminCount = users?.filter((u) => u.role === "admin").length || 0

  // Get recent activity count (last 24 hours)
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const recentActivityCount =
    recentTransactions?.filter((activity) => new Date(activity.created_at) > twentyFourHoursAgo).length || 0

  const transformedActivity =
    recentTransactions?.map((transaction: any) => ({
      id: transaction.id,
      transaction_type: transaction.transaction_type,
      quantity_change: transaction.quantity_change,
      notes: transaction.reason,
      created_at: transaction.created_at,
      user_name: transaction.performed_by,
    })) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">AmbuSupply</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Administrator Dashboard" : "Inventory Management System"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                Welcome, {userProfile?.full_name || user.email}
                {userProfile?.role && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {userProfile.role}
                  </span>
                )}
              </span>
              <form action={handleSignOut}>
                <Button variant="outline" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? (
          // Admin Dashboard
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="system">System Health</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                      <div className="text-sm text-muted-foreground">Total Items</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">{belowParCount}</div>
                      <div className="text-sm text-muted-foreground">Below Par</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">{expiringCount}</div>
                      <div className="text-sm text-muted-foreground">Expiring Soon</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{locationCount}</div>
                      <div className="text-sm text-muted-foreground">Locations</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Locations</CardTitle>
                      <CardDescription>Manage storage locations and units</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href="/locations">Manage Locations</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory</CardTitle>
                      <CardDescription>View and manage inventory items</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href="/inventory">Manage Inventory</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reports</CardTitle>
                      <CardDescription>View usage trends and alerts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <Link href="/reports">View Reports</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement users={users || []} currentUserId={user.id} />
            </TabsContent>

            <TabsContent value="activity">
              <RecentActivity activities={transformedActivity} />
            </TabsContent>

            <TabsContent value="system">
              <SystemHealth
                stats={{
                  totalItems,
                  belowParCount,
                  expiringCount,
                  locationCount,
                  userCount,
                  adminCount,
                  recentActivityCount,
                }}
              />
            </TabsContent>
          </Tabs>
        ) : (
          // Staff Dashboard
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{belowParCount}</div>
                  <div className="text-sm text-muted-foreground">Below Par</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{expiringCount}</div>
                  <div className="text-sm text-muted-foreground">Expiring Soon</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{locationCount}</div>
                  <div className="text-sm text-muted-foreground">Locations</div>
                </CardContent>
              </Card>
            </div>

            {/* Staff Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>View inventory and mark items as used</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/inventory">View Inventory</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>View usage trends and search items</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/reports">View Reports</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity for Staff */}
            <RecentActivity activities={transformedActivity.slice(0, 5)} />
          </div>
        )}
      </main>
    </div>
  )
}
