import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LocationsClient } from "./locations-client"

export default async function LocationsPage() {
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

  // Fetch locations with their storage units
  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select(`
      id,
      name,
      description,
      storage_units (
        id,
        name,
        type,
        description,
        position_order,
        parent_unit_id
      )
    `)
    .order("name")

  if (locationsError) {
    console.error("Error fetching locations:", locationsError)
  }

  // Transform the flat storage units into a hierarchical structure
  const transformedLocations =
    locations?.map((location) => {
      const storageUnitsMap = new Map()
      const rootUnits: any[] = []

      // First pass: create all units
      location.storage_units.forEach((unit: any) => {
        storageUnitsMap.set(unit.id, { ...unit, children: [] })
      })

      // Second pass: build hierarchy
      location.storage_units.forEach((unit: any) => {
        const unitWithChildren = storageUnitsMap.get(unit.id)
        if (unit.parent_unit_id) {
          const parent = storageUnitsMap.get(unit.parent_unit_id)
          if (parent) {
            parent.children.push(unitWithChildren)
          }
        } else {
          rootUnits.push(unitWithChildren)
        }
      })

      // Sort by position_order
      const sortUnits = (units: any[]) => {
        units.sort((a, b) => a.position_order - b.position_order)
        units.forEach((unit) => {
          if (unit.children.length > 0) {
            sortUnits(unit.children)
          }
        })
      }
      sortUnits(rootUnits)

      return {
        ...location,
        storage_units: rootUnits,
      }
    }) || []

  return <LocationsClient locations={transformedLocations} userRole={profile?.role || "staff"} />
}
