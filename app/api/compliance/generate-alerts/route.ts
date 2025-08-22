import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the stored procedure to generate compliance alerts
    const { error } = await supabase.rpc("generate_compliance_alerts")

    if (error) {
      console.error("Error generating compliance alerts:", error)
      return NextResponse.json({ error: "Failed to generate compliance alerts" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Compliance alerts generated successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get("vehicle_id")
    const severity = searchParams.get("severity")
    const acknowledged = searchParams.get("acknowledged")

    let query = supabase
      .from("compliance_alerts")
      .select(`
        *,
        vehicle:vehicles(vehicle_number, make, model),
        inventory_item:inventory_items(name, category, unit_of_measure),
        vehicle_inventory_item:vehicle_inventory_items(current_quantity, par_level_min, par_level_max)
      `)
      .order("created_at", { ascending: false })

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    }

    if (severity) {
      query = query.eq("severity", severity)
    }

    if (acknowledged !== null) {
      query = query.eq("is_acknowledged", acknowledged === "true")
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch compliance alerts" }, { status: 500 })
    }

    return NextResponse.json({ alerts: data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
