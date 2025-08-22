import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/mobile/vehicles - Get vehicles for mobile app
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const vehicleType = searchParams.get("vehicle_type")

    let query = supabase
      .from("vehicles")
      .select(`
        id,
        vehicle_number,
        make,
        model,
        year,
        vehicle_type,
        status,
        mileage,
        fuel_capacity,
        current_location
      `)
      .order("vehicle_number")

    if (status) {
      query = query.eq("status", status)
    }

    if (vehicleType) {
      query = query.eq("vehicle_type", vehicleType)
    }

    const { data: vehicles, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      vehicles: vehicles || [],
      count: vehicles?.length || 0,
    })
  } catch (error) {
    console.error("Vehicles API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
