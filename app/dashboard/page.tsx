import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/app-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardActions } from "@/components/dashboard-actions"
import { UserManagement } from "@/components/user-management"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function fetchDashboardData(supabase: any, isAdmin: boolean, userId: string) {
  const queries = [
    supabase.from("inventory_items").select("id, current_quantity, par_level, expiration_date"),
    supabase.from("locations").select("id"),
    supabase
      .from("transactions")
      .select(`
      id, transaction_type, quantity_change, reason, created_at, performed_by
    `)
      .order("created_at", { ascending: false })
      .limit(20),
  ]

  if (isAdmin) {
    queries.push(supabase.from("profiles").select("*").order("created_at", { ascending: false }))
  }

  const results = await Promise.allSettled(queries)

  return {
    inventoryItems: results[0].status === "fulfilled" ? results[0].value.data || [] : [],
    locations: results[1].status === "fulfilled" ? results[1].value.data || [] : [],
    recentTransactions: results[2].status === "fulfilled" ? results[2].value.data || [] : [],
    users: isAdmin && results[3]?.status === "fulfilled" ? results[3].value.data || [] : [],
  }
}

function createUserProfile(user: any, profile: any) {
  return (
    profile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || "staff",
    }
  )
}

function calculateStats(inventoryItems: any[], locations: any[], users: any[], recentTransactions: any[]) {
  const totalItems = inventoryItems.length
  const belowParCount = inventoryItems.filter(
    (item) => item.current_quantity < item.par_level && item.par_level > 0,
  ).length

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringCount = inventoryItems.filter(
    (item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow,
  ).length

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const recentActivityCount = recentTransactions.filter(
    (activity) => new Date(activity.created_at) > twentyFourHoursAgo,
  ).length

  return {
    totalItems,
    belowParCount,
    expiringCount,
    locationCount: locations.length,
    userCount: users.length,
    adminCount: users.filter((u) => u.role === "admin").length,
    recentActivityCount,
  }
}

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const userProfile = createUserProfile(user, profile)
  const isAdmin = userProfile?.role === "admin"

  const { inventoryItems, locations, users, recentTransactions } = await fetchDashboardData(supabase, isAdmin, user.id)

  const stats = calculateStats(inventoryItems, locations, users, recentTransactions)

  const transformedActivity = recentTransactions.map((transaction: any) => ({
    id: transaction.id,
    transaction_type: transaction.transaction_type,
    quantity_change: transaction.quantity_change,
    notes: transaction.reason,
    created_at: transaction.created_at,
    user_name: transaction.performed_by,
  }))

  return (
    <AppLayout user={userProfile} stats={{ belowParCount: stats.belowParCount, expiringCount: stats.expiringCount }}>
      <div className="h-full">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">
            {isAdmin ? "Administrator Dashboard" : "Dashboard"}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {isAdmin ? "System overview and management tools" : "Inventory overview and quick actions"}
          </p>
        </div>

        {isAdmin ? (
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-card border border-border/50 rounded-2xl p-2 shadow-sm">
              <TabsTrigger value="overview" className="rounded-xl font-medium">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl font-medium">
                User Management
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl font-medium">
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-xl font-medium">
                System Health
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-8">
                <DashboardStats stats={stats} />
                <DashboardActions isAdmin={true} />
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement users={users} currentUserId={user.id} />
            </TabsContent>

            <TabsContent value="activity">
              <RecentActivity activities={transformedActivity} />
            </TabsContent>

            <TabsContent value="system">
              <SystemHealth stats={stats} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-8">
            <DashboardStats stats={stats} />
            <DashboardActions isAdmin={false} />
            <RecentActivity activities={transformedActivity.slice(0, 5)} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
