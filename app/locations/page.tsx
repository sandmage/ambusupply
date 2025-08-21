import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LocationsClient } from "./locations-client"
import { AppLayout } from "@/components/app-layout"

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
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const userProfile = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || "staff",
  }

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
        unit_type,
        parent_unit_id,
        position_info
      )
    `)
    .order("name")

  if (locationsError) {
    return <div>Error loading locations. Please refresh the page.</div>
  }

  // Transform the flat storage units into a hierarchical structure
  const transformedLocations =
    locations?.map((location) => {
      const storageUnitsMap = new Map()
      const rootUnits: any[] = []

      // First pass: create all units and map unit_type to type
      location.storage_units.forEach((unit: any) => {
        storageUnitsMap.set(unit.id, {
          ...unit,
          type: unit.unit_type, // Map unit_type from database to type for frontend
          children: [],
        })
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

      // Sort by name instead
      const sortUnits = (units: any[]) => {
        units.sort((a, b) => a.name.localeCompare(b.name))
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

  // Calculate stats for sidebar
  const totalLocations = transformedLocations.length
  const totalStorageUnits = transformedLocations.reduce((acc, location) => {
    const countUnits = (units: any[]): number => {
      return units.reduce((count, unit) => {
        return count + 1 + (unit.children ? countUnits(unit.children) : 0)
      }, 0)
    }
    return acc + countUnits(location.storage_units)
  }, 0)

  return (
    <AppLayout user={userProfile} stats={{ belowParCount: 0, expiringCount: 0 }}>
      <LocationsClient
        locations={transformedLocations}
        userRole={userProfile.role}
        stats={{ totalLocations, totalStorageUnits }}
      />
    </AppLayout>
  )
}
