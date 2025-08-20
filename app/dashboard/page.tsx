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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  const isAdmin = profile?.role === "admin"

  // Fetch comprehensive dashboard data
  const [
    { data: inventoryStats },
    { data: belowParItems },
    { data: expiringItems },
    { data: locations },
    { data: users },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("inventory_items").select("id, quantity, min_par_level"),
    supabase.from("items_below_par").select("id"),
    supabase.from("expiring_items").select("id"),
    supabase.from("locations").select("id"),
    isAdmin ? supabase.from("profiles").select("*").order("created_at", { ascending: false }) : { data: [] },
    supabase
      .from("inventory_transactions")
      .select(`
        id,
        transaction_type,
        quantity_change,
        quantity_after,
        notes,
        created_at,
        inventory_items!inner (
          name,
          locations!inner (name)
        ),
        profiles (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  // Calculate stats
  const totalItems = inventoryStats?.length || 0
  const belowParCount = belowParItems?.length || 0
  const expiringCount = expiringItems?.length || 0
  const locationCount = locations?.length || 0
  const userCount = users?.length || 0
  const adminCount = users?.filter((u) => u.role === "admin").length || 0

  // Get recent activity count (last 24 hours)
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const recentActivityCount =
    recentActivity?.filter((activity) => new Date(activity.created_at) > twentyFourHoursAgo).length || 0

  // Transform recent activity data
  const transformedActivity =
    recentActivity?.map((activity: any) => ({
      id: activity.id,
      transaction_type: activity.transaction_type,
      quantity_change: activity.quantity_change,
      quantity_after: activity.quantity_after,
      notes: activity.notes,
      created_at: activity.created_at,
      item_name: activity.inventory_items.name,
      location_name: activity.inventory_items.locations.name,
      user_name: activity.profiles?.full_name,
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
                Welcome, {profile?.full_name || user.email}
                {profile?.role && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{profile.role}</span>
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
