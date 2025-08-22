import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MedicationsClient } from "./medications-client"
import { AppLayout } from "@/components/app-layout"

export const dynamic = "force-dynamic"

export default async function MedicationsPage() {
  console.log("[v0] [SERVER] Starting medications page render...")

  let supabase
  try {
    console.log("[v0] [SERVER] Creating Supabase server client...")
    supabase = await createServerClient()
    console.log("[v0] [SERVER] Supabase server client created successfully")
  } catch (error) {
    console.error("[v0] [SERVER] Failed to create Supabase client:", error)
    return <div>Error connecting to database. Please refresh the page.</div>
  }

  let user
  try {
    console.log("[v0] [SERVER] Attempting to get user...")
    const { data: userData, error } = await supabase.auth.getUser()
    if (error) {
      console.error("[v0] [SERVER] Auth error:", error)
      redirect("/auth/login")
    }
    if (!userData?.user) {
      console.log("[v0] [SERVER] No user found, redirecting to login")
      redirect("/auth/login")
    }
    user = userData.user
    console.log("[v0] [SERVER] User authenticated successfully:", user.id)
  } catch (error) {
    console.error("[v0] [SERVER] Failed to authenticate user:", error)
    redirect("/auth/login")
  }

  let profile
  try {
    console.log("[v0] [SERVER] Fetching user profile...")
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    if (profileError) {
      console.error("[v0] [SERVER] Profile query error:", profileError)
    } else {
      console.log("[v0] [SERVER] Profile query successful")
    }
    profile = profileData
  } catch (error) {
    console.error("[v0] [SERVER] Failed to fetch profile:", error)
    profile = null
  }

  const userProfile = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || "staff",
  }

  let medicationItems: any[] = []
  try {
    console.log("[v0] [SERVER] Fetching medication items...")
    const { data: medicationData, error: medicationError } = await supabase
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
      .or(
        "category.ilike.%medication%,category.ilike.%drug%,category.ilike.%pharmaceutical%,name.ilike.%mg%,name.ilike.%ml%,unit_of_measure.in.(mg,ml,dose,vial,ampule)",
      )
      .order("expiration_date", { ascending: true, nullsFirst: false })

    if (medicationError) {
      console.error("[v0] [SERVER] Medication query error:", medicationError)
      medicationItems = []
    } else {
      medicationItems = medicationData || []
      console.log("[v0] [SERVER] Medication query successful, items count:", medicationItems.length)
    }
  } catch (error) {
    console.error("[v0] [SERVER] Failed to fetch medication items:", error)
    medicationItems = []
  }

  let locations: any[] = []
  try {
    console.log("[v0] [SERVER] Fetching locations...")
    const { data: locationsData, error: locationsError } = await supabase
      .from("locations")
      .select(`
        id,
        name,
        storage_units (
          id,
          name,
          unit_type
        )
      `)
      .order("name")

    if (locationsError) {
      console.error("[v0] [SERVER] Locations query error:", locationsError)
      locations = []
    } else {
      locations = locationsData || []
      console.log("[v0] [SERVER] Locations query successful, locations count:", locations.length)
    }
  } catch (error) {
    console.error("[v0] [SERVER] Failed to fetch locations:", error)
    locations = []
  }

  console.log("[v0] [SERVER] All queries completed, rendering page...")

  // Transform medication data
  const transformedMedications =
    medicationItems?.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.current_quantity,
      min_par_level: item.par_level,
      unit_of_measure: item.unit_of_measure,
      expiration_date: item.expiration_date,
      lot_number: item.lot_number,
      location_id: item.locations?.id,
      location_name: item.locations?.name,
      storage_unit_name: item.storage_units?.name,
      storage_unit_type: item.storage_units?.unit_type,
      created_at: item.created_at,
    })) || []

  // Calculate medication-specific stats
  const totalMedications = transformedMedications.length
  const expiredCount = transformedMedications.filter(
    (item) => item.expiration_date && new Date(item.expiration_date) < new Date(),
  ).length
  const expiringSoonCount = transformedMedications.filter((item) => {
    if (!item.expiration_date) return false
    const expirationDate = new Date(item.expiration_date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expirationDate <= thirtyDaysFromNow && expirationDate >= new Date()
  }).length
  const lowStockCount = transformedMedications.filter(
    (item) => item.quantity < item.min_par_level && item.min_par_level > 0,
  ).length

  return (
    <AppLayout user={userProfile} stats={{ belowParCount: lowStockCount, expiringCount: expiringSoonCount }}>
      <MedicationsClient medications={transformedMedications} locations={locations} userRole={userProfile.role} />
    </AppLayout>
  )
}
