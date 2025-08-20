import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/user-management"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const userProfile = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || "staff",
  }

  const handleSignOut = async () => {
    "use server"
    const supabase = createServerClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  const isAdmin = userProfile?.role === "admin"

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
    inventoryItems = []
  }

  try {
    const { data: locationsData } = await supabase.from("locations").select("id")
    locations = locationsData || []
  } catch (err) {
    locations = []
  }

  if (isAdmin) {
    try {
      const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
      users = usersData || []
    } catch (err) {
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
    recentTransactions = []
  }

  const totalItems = inventoryItems?.length || 0
  const belowParCount =
    inventoryItems?.filter((item) => item.current_quantity < item.par_level && item.par_level > 0).length || 0

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringCount =
    inventoryItems?.filter((item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow)
      .length || 0

  const locationCount = locations?.length || 0
  const userCount = users?.length || 0
  const adminCount = users?.filter((u) => u.role === "admin").length || 0

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
    <AppLayout user={userProfile} stats={{ belowParCount, expiringCount }}>
      <div className="h-full bg-background">
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground medical-heading">
              {isAdmin ? "Administrator Dashboard" : "Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "System overview and management tools" : "Inventory overview and quick actions"}
            </p>
          </div>
        </div>

        <div className="p-6">
          {isAdmin ? (
            // Admin Dashboard
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="system">System Health</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-primary">{totalItems}</div>
                        <div className="text-sm text-muted-foreground font-medium">Total Items</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-destructive">{belowParCount}</div>
                        <div className="text-sm text-muted-foreground font-medium">Below Par Level</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-destructive">{expiringCount}</div>
                        <div className="text-sm text-muted-foreground font-medium">Expiring Soon</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-secondary">{locationCount}</div>
                        <div className="text-sm text-muted-foreground font-medium">Storage Locations</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Storage Locations</CardTitle>
                        <CardDescription>Manage physical storage locations and organizational units</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild className="w-full bg-primary hover:bg-primary/90">
                          <Link href="/locations">Manage Locations</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Inventory Management</CardTitle>
                        <CardDescription>View, add, and manage medical supply inventory</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild className="w-full bg-primary hover:bg-primary/90">
                          <Link href="/inventory">Manage Inventory</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Analytics & Reports</CardTitle>
                        <CardDescription>View usage trends, alerts, and generate reports</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild className="w-full bg-primary hover:bg-primary/90">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-primary">{totalItems}</div>
                    <div className="text-sm text-muted-foreground font-medium">Total Items</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-destructive">{belowParCount}</div>
                    <div className="text-sm text-muted-foreground font-medium">Below Par Level</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-destructive">{expiringCount}</div>
                    <div className="text-sm text-muted-foreground font-medium">Expiring Soon</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-secondary">{locationCount}</div>
                    <div className="text-sm text-muted-foreground font-medium">Storage Locations</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Inventory Access</CardTitle>
                    <CardDescription>View inventory items and record usage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/inventory">Access Inventory</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Reports & Search</CardTitle>
                    <CardDescription>View usage trends and search for items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/reports">View Reports</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <RecentActivity activities={transformedActivity.slice(0, 5)} />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
