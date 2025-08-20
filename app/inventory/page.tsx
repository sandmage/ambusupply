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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

  // Fetch inventory items with location information
  const { data: inventoryItems, error: inventoryError } = await supabase
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
    return <div>Error loading inventory. Please refresh the page.</div>
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
        unit_type
      )
    `)
    .order("name")

  if (locationsError) {
    return <div>Error loading locations. Please refresh the page.</div>
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
      location_name: item.locations.name,
      storage_unit_name: item.storage_units?.name,
      storage_unit_type: item.storage_units?.unit_type,
      created_at: item.created_at,
    })) || []

  return (
    <InventoryClient items={transformedInventory} locations={locations || []} userRole={profile?.role || "staff"} />
  )
}
