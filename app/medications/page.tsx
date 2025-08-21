import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MedicationsClient } from "./medications-client"
import { AppLayout } from "@/components/app-layout"

export default async function MedicationsPage() {
  const supabase = await createServerClient()

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

  // Fetch medication items (filtering for medication categories)
  const { data: medicationItems, error: medicationError } = await supabase
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
    return <div>Error loading medications. Please refresh the page.</div>
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
      location_id: item.locations.id,
      location_name: item.locations.name,
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
      <MedicationsClient medications={transformedMedications} locations={locations || []} userRole={userProfile.role} />
    </AppLayout>
  )
}
