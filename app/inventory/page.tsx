import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { InventoryClient } from "./inventory-client"
import { AppLayout } from "@/components/app-layout"
import type { UserProfile } from "@/types/user-profile" // Assuming UserProfile type is defined here

export default async function InventoryPage() {
  console.log("[v0] [SERVER] Starting inventory page render...")

  try {
    console.log("[v0] [SERVER] Creating Supabase server client...")
    const supabase = await createServerClient()
    console.log("[v0] [SERVER] Supabase server client created successfully")

    console.log("[v0] [SERVER] Attempting to get user...")
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("[v0] [SERVER] Auth error:", error)
      redirect("/auth/login")
    }

    if (!user) {
      console.log("[v0] [SERVER] No user found, redirecting to login")
      redirect("/auth/login")
    }

    console.log("[v0] [SERVER] User authenticated successfully:", user.id)

    let profile = null
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
        profile = profileData
        console.log("[v0] [SERVER] Profile query successful")
      }
    } catch (profileError) {
      console.error("[v0] [SERVER] Profile query failed:", profileError)
    }

    let inventoryItems: any[] = []
    let locations: any[] = []

    try {
      console.log("[v0] [SERVER] Fetching inventory items...")
      const { data: inventoryData, error: inventoryError } = await supabase
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

      if (inventoryError) {
        console.error("[v0] [SERVER] Inventory query error:", inventoryError)
      } else {
        inventoryItems = inventoryData || []
        console.log("[v0] [SERVER] Inventory query successful, items count:", inventoryItems.length)
      }
    } catch (inventoryError) {
      console.error("[v0] [SERVER] Inventory query failed:", inventoryError)
    }

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
      } else {
        locations = locationsData || []
        console.log("[v0] [SERVER] Locations query successful, locations count:", locations.length)
      }
    } catch (locationsError) {
      console.error("[v0] [SERVER] Locations query failed:", locationsError)
    }

    // Transform inventory data
    const transformedInventory =
      inventoryItems?.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.current_quantity,
        min_par_level: item.par_level,
        unit_of_measure: item.unit_of_measure,
        expiration_date: item.expiration_date,
        lot_number: item.lot_number,
        location_id: item.locations.id,
        storage_unit_id: item.storage_units?.id || "",
        location_name: item.locations.name,
        storage_unit_name: item.storage_units?.name,
        storage_unit_type: item.storage_units?.unit_type,
        created_at: item.created_at,
      })) || []

    // Calculate stats for sidebar
    const belowParCount = transformedInventory.filter(
      (item) => item.quantity < item.min_par_level && item.min_par_level > 0,
    ).length
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const expiringCount = transformedInventory.filter(
      (item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow,
    ).length

    const transformedLocations =
      locations?.map((location: any) => ({
        id: location.id,
        name: location.name,
        storage_units:
          location.storage_units?.map((unit: any) => ({
            id: unit.id,
            name: unit.name,
            type: unit.unit_type, // Map unit_type to type
            location_id: location.id, // Add missing location_id
          })) || [],
      })) || []

    console.log("[v0] [SERVER] All queries completed successfully, rendering page...")

    const userProfile: UserProfile = profile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      role: user.user_metadata?.role || "staff",
    }

    return (
      <AppLayout user={userProfile} stats={{ belowParCount, expiringCount }}>
        <InventoryClient items={transformedInventory} locations={transformedLocations} userRole={userProfile.role} />
      </AppLayout>
    )
  } catch (error) {
    console.error("[v0] [SERVER] Unexpected error in inventory page:", error)
    redirect("/auth/login")
  }
}
