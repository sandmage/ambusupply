import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReportsClient } from "./reports-client"

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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // Fetch items below par level
  const { data: belowParItems } = await supabase
    .from("items_below_par")
    .select(`
      id,
      name,
      quantity,
      min_par_level,
      unit_of_measure,
      location_name,
      storage_unit_name,
      shortage_amount
    `)
    .order("shortage_amount", { ascending: false })

  // Fetch expiring items
  const { data: expiringItems } = await supabase
    .from("expiring_items")
    .select(`
      id,
      name,
      quantity,
      min_par_level,
      unit_of_measure,
      expiration_date,
      location_name,
      storage_unit_name,
      days_until_expiration
    `)
    .order("days_until_expiration")

  // Fetch usage trends using the database function
  const { data: usageTrends } = await supabase.rpc("get_usage_trends", { days_back: 30 })

  // Get inventory summary stats
  const { data: inventoryStats } = await supabase.from("inventory_items").select(`
      id,
      quantity,
      min_par_level,
      expiration_date,
      locations!inner (name)
    `)

  const totalItems = inventoryStats?.length || 0
  const belowParCount = belowParItems?.length || 0
  const expiringCount = expiringItems?.length || 0

  // Count unique locations
  const uniqueLocations = new Set(inventoryStats?.map((item) => (item as any).locations.name))
  const locationCount = uniqueLocations.size

  return (
    <ReportsClient
      belowParItems={belowParItems || []}
      expiringItems={expiringItems || []}
      usageTrends={usageTrends || []}
      stats={{
        totalItems,
        belowParCount,
        expiringCount,
        locationCount,
      }}
      userRole={profile?.role || "staff"}
    />
  )
}
