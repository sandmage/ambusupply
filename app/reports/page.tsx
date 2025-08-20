import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsClient } from "./reports-client"
import { AppLayout } from "@/components/app-layout"

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const userProfile = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || "staff",
  }

  // Fetch inventory items for comprehensive analytics
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select(`
      id,
      name,
      description,
      current_quantity,
      par_level,
      unit_of_measure,
      expiration_date,
      lot_number,
      created_at,
      locations!inner (
        id,
        name
      ),
      storage_units (
        id,
        name,
        unit_type
      )
    `)
    .order("name")

  // Fetch recent transactions for usage analytics
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(`
      id,
      transaction_type,
      quantity_change,
      reason,
      created_at,
      performed_by,
      item_id
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  // Process data for analytics
  const processedItems =
    inventoryItems?.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      current_quantity: item.current_quantity,
      par_level: item.par_level,
      unit_of_measure: item.unit_of_measure,
      expiration_date: item.expiration_date,
      lot_number: item.lot_number,
      location_name: item.locations.name,
      storage_unit_name: item.storage_units?.name,
      storage_unit_type: item.storage_units?.unit_type,
      created_at: item.created_at,
    })) || []

  // Calculate comprehensive statistics
  const totalItems = processedItems.length
  const belowParItems = processedItems.filter((item) => item.current_quantity < item.par_level && item.par_level > 0)
  const belowParCount = belowParItems.length

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringItems = processedItems.filter(
    (item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow,
  )
  const expiringCount = expiringItems.length

  const outOfStockItems = processedItems.filter((item) => item.current_quantity === 0)
  const outOfStockCount = outOfStockItems.length

  // Count unique locations
  const uniqueLocations = new Set(processedItems.map((item) => item.location_name))
  const locationCount = uniqueLocations.size

  // Process usage trends from transactions
  const usageTrends =
    recentTransactions?.reduce((acc: any[], transaction: any) => {
      if (transaction.transaction_type === "use") {
        const item = processedItems.find((i) => i.id === transaction.item_id)
        if (item) {
          const existing = acc.find((t) => t.item_name === item.name)
          if (existing) {
            existing.total_used += Math.abs(transaction.quantity_change)
            existing.transaction_count += 1
          } else {
            acc.push({
              item_name: item.name,
              total_used: Math.abs(transaction.quantity_change),
              transaction_count: 1,
              location_name: item.location_name,
              avg_daily_usage: Math.abs(transaction.quantity_change) / 30,
            })
          }
        }
      }
      return acc
    }, []) || []

  // Sort by total usage
  usageTrends.sort((a, b) => b.total_used - a.total_used)

  return (
    <AppLayout user={userProfile} stats={{ belowParCount, expiringCount }}>
      <ReportsClient
        belowParItems={belowParItems}
        expiringItems={expiringItems}
        outOfStockItems={outOfStockItems}
        usageTrends={usageTrends}
        allItems={processedItems}
        transactions={recentTransactions || []}
        stats={{
          totalItems,
          belowParCount,
          expiringCount,
          outOfStockCount,
          locationCount,
        }}
        userRole={userProfile.role}
      />
    </AppLayout>
  )
}
