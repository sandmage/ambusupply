import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, Calendar, MapPin, Activity } from "lucide-react"

export default async function DashboardPage() {
  console.log("[v0] Dashboard: Creating server client...")

  try {
    const supabase = await createServerClient()
    console.log("[v0] Dashboard: Server client created successfully")

    console.log("[v0] Dashboard: Attempting to get user...")
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.log("[v0] Dashboard: Auth error:", error.message)
      redirect("/auth/login")
    }

    if (!user) {
      console.log("[v0] Dashboard: No user found, redirecting to login")
      redirect("/auth/login")
    }

    console.log("[v0] Dashboard: User authenticated successfully:", user.id)

    console.log("[v0] Dashboard: Fetching user profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.log("[v0] Dashboard: Profile query error:", profileError.message)
    } else {
      console.log("[v0] Dashboard: Profile query successful")
    }

    const userProfile = profile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || "staff",
    }

    console.log("[v0] Dashboard: Starting parallel database queries...")

    const [inventoryResult, locationsResult, activityResult] = await Promise.allSettled([
      (async () => {
        console.log("[v0] Dashboard: Fetching inventory items...")
        try {
          const result = await supabase
            .from("inventory_items")
            .select("id, current_quantity, par_level, expiration_date, name")
          console.log("[v0] Dashboard: Inventory query successful, items:", result.data?.length || 0)
          return result
        } catch (error) {
          console.log("[v0] Dashboard: Inventory query failed:", error)
          throw error
        }
      })(),
      (async () => {
        console.log("[v0] Dashboard: Fetching locations...")
        try {
          const result = await supabase.from("locations").select("id")
          console.log("[v0] Dashboard: Locations query successful, count:", result.data?.length || 0)
          return result
        } catch (error) {
          console.log("[v0] Dashboard: Locations query failed:", error)
          throw error
        }
      })(),
      (async () => {
        console.log("[v0] Dashboard: Fetching recent activity...")
        try {
          const result = await supabase
            .from("transactions")
            .select("id, transaction_type, quantity_change, reason, created_at, performed_by")
            .order("created_at", { ascending: false })
            .limit(5)
          console.log("[v0] Dashboard: Activity query successful, items:", result.data?.length || 0)
          return result
        } catch (error) {
          console.log("[v0] Dashboard: Activity query failed:", error)
          throw error
        }
      })(),
    ])

    console.log("[v0] Dashboard: Query results:", {
      inventory: inventoryResult.status,
      locations: locationsResult.status,
      activity: activityResult.status,
    })

    if (inventoryResult.status === "rejected") {
      console.log("[v0] Dashboard: Inventory query rejection reason:", inventoryResult.reason)
    }
    if (locationsResult.status === "rejected") {
      console.log("[v0] Dashboard: Locations query rejection reason:", locationsResult.reason)
    }
    if (activityResult.status === "rejected") {
      console.log("[v0] Dashboard: Activity query rejection reason:", activityResult.reason)
    }

    const inventoryItems = inventoryResult.status === "fulfilled" ? inventoryResult.value.data || [] : []
    const locations = locationsResult.status === "fulfilled" ? locationsResult.value.data || [] : []
    const recentActivity = activityResult.status === "fulfilled" ? activityResult.value.data || [] : []

    console.log("[v0] Dashboard: Final data counts:", {
      inventoryItems: inventoryItems.length,
      locations: locations.length,
      recentActivity: recentActivity.length,
    })

    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter((item) => item.current_quantity < item.par_level && item.par_level > 0)

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const expiringItems = inventoryItems.filter(
      (item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow,
    )

    return (
      <AppLayout
        user={userProfile}
        stats={{ belowParCount: lowStockItems.length, expiringCount: expiringItems.length }}
      >
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">
              Welcome back, {userProfile.full_name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">Here's what's happening with your inventory today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
                {lowStockItems.length > 0 && (
                  <Badge variant="outline" className="mt-2 text-orange-600 border-orange-200">
                    Needs attention
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Calendar className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{expiringItems.length}</div>
                {expiringItems.length > 0 && (
                  <Badge variant="outline" className="mt-2 text-red-600 border-red-200">
                    Check dates
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif">Locations</CardTitle>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locations.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif">Recent Activity</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.transaction_type === "in"
                            ? "Stock Added"
                            : activity.transaction_type === "out"
                              ? "Stock Removed"
                              : "Stock Adjusted"}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.reason}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.transaction_type === "in" ? "default" : "secondary"}>
                          {activity.transaction_type === "in" ? "+" : ""}
                          {activity.quantity_change}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  } catch (serverError) {
    console.log("[v0] Dashboard: Server error:", serverError)
    redirect("/auth/login")
  }
}
