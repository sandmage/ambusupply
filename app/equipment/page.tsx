import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/app-layout"
import { EquipmentClient } from "./equipment-client"

export default async function EquipmentPage() {
  console.log("[v0] [SERVER] Starting equipment page render...")

  try {
    console.log("[v0] [SERVER] Creating Supabase server client...")
    const supabase = await createServerClient()

    console.log("[v0] [SERVER] Checking user authentication...")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] [SERVER] Authentication failed, redirecting to login")
      redirect("/auth/login")
    }

    console.log("[v0] [SERVER] User authenticated:", user.id)

    // Fetch user profile
    console.log("[v0] [SERVER] Fetching user profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.log("[v0] [SERVER] Profile query error:", profileError.message)
    } else {
      console.log("[v0] [SERVER] Profile query successful")
    }

    // Fetch equipment with related data
    console.log("[v0] [SERVER] Fetching equipment data...")
    const { data: equipmentData, error: equipmentError } = await supabase
      .from("equipment")
      .select(`
        *,
        equipment_types (
          id,
          name,
          category,
          manufacturer,
          model
        ),
        locations (
          id,
          name
        ),
        vehicles (
          id,
          vehicle_number,
          make,
          model
        )
      `)
      .order("created_at", { ascending: false })

    if (equipmentError) {
      console.log("[v0] [SERVER] Equipment query error:", equipmentError.message)
    } else {
      console.log("[v0] [SERVER] Equipment query successful, equipment count:", equipmentData?.length || 0)
    }

    // Fetch equipment types for forms
    console.log("[v0] [SERVER] Fetching equipment types...")
    const { data: equipmentTypes, error: typesError } = await supabase.from("equipment_types").select("*").order("name")

    if (typesError) {
      console.log("[v0] [SERVER] Equipment types query error:", typesError.message)
    } else {
      console.log("[v0] [SERVER] Equipment types query successful, types count:", equipmentTypes?.length || 0)
    }

    // Fetch locations for assignments
    console.log("[v0] [SERVER] Fetching locations...")
    const { data: locations, error: locationsError } = await supabase.from("locations").select("id, name").order("name")

    if (locationsError) {
      console.log("[v0] [SERVER] Locations query error:", locationsError.message)
    } else {
      console.log("[v0] [SERVER] Locations query successful, locations count:", locations?.length || 0)
    }

    // Fetch vehicles for assignments
    console.log("[v0] [SERVER] Fetching vehicles...")
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model")
      .order("vehicle_number")

    if (vehiclesError) {
      console.log("[v0] [SERVER] Vehicles query error:", vehiclesError.message)
    } else {
      console.log("[v0] [SERVER] Vehicles query successful, vehicles count:", vehicles?.length || 0)
    }

    // Calculate stats
    const totalEquipment = equipmentData?.length || 0
    const inServiceCount = equipmentData?.filter((eq) => eq.status === "in_service").length || 0
    const maintenanceCount = equipmentData?.filter((eq) => eq.status === "maintenance").length || 0
    const outOfServiceCount = equipmentData?.filter((eq) => eq.status === "out_of_service").length || 0

    const userProfile = profile || {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "",
      role: "staff" as const,
    }

    console.log("[v0] [SERVER] Equipment page render complete")

    return (
      <AppLayout
        user={userProfile}
        stats={{
          belowParCount: maintenanceCount,
          expiringCount: outOfServiceCount,
        }}
      >
        <EquipmentClient
          equipment={equipmentData || []}
          equipmentTypes={equipmentTypes || []}
          locations={locations || []}
          vehicles={vehicles || []}
          userRole={userProfile.role}
          stats={{
            total: totalEquipment,
            inService: inServiceCount,
            maintenance: maintenanceCount,
            outOfService: outOfServiceCount,
          }}
        />
      </AppLayout>
    )
  } catch (error) {
    console.error("[v0] [SERVER] Equipment page error:", error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Equipment</h1>
          <p className="text-muted-foreground">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }
}
