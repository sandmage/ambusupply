import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InventoryClient } from "./inventory-client"

export default async function InventoryPage() {
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

  // Fetch inventory items with location information
  const { data: inventoryItems, error: inventoryError } = await supabase
    .from("inventory_items")
    .select(`
      id,
      name,
      description,
      quantity,
      min_par_level,
      unit_of_measure,
      expiration_date,
      notes,
      created_at,
      locations!inner (
        id,
        name
      ),
      storage_units (
        id,
        name,
        type
      )
    `)
    .order("name")

  if (inventoryError) {
    console.error("Error fetching inventory:", inventoryError)
  }

  // Fetch locations with storage units for the form
  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select(`
      id,
      name,
      storage_units (
        id,
        name,
        type
      )
    `)
    .order("name")

  if (locationsError) {
    console.error("Error fetching locations:", locationsError)
  }

  // Transform inventory data
  const transformedInventory =
    inventoryItems?.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      min_par_level: item.min_par_level,
      unit_of_measure: item.unit_of_measure,
      expiration_date: item.expiration_date,
      notes: item.notes,
      location_name: item.locations.name,
      storage_unit_name: item.storage_units?.name,
      created_at: item.created_at,
    })) || []

  return (
    <InventoryClient items={transformedInventory} locations={locations || []} userRole={profile?.role || "staff"} />
  )
}
