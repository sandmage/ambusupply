import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/mobile/daily-checks/forms - Get available daily check forms
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleType = searchParams.get("vehicle_type")

    let query = supabase.from("daily_check_forms").select("*").eq("is_active", true).order("name")

    if (vehicleType) {
      query = query.contains("vehicle_types", [vehicleType])
    }

    const { data: forms, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Transform forms for mobile consumption
    const mobileForms = forms?.map((form) => ({
      id: form.id,
      name: form.name,
      description: form.description,
      vehicle_types: form.vehicle_types,
      checklist_items: form.checklist_items,
      version: form.updated_at, // For caching/sync purposes
    }))

    return NextResponse.json({
      success: true,
      forms: mobileForms || [],
      count: mobileForms?.length || 0,
    })
  } catch (error) {
    console.error("Daily check forms API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
