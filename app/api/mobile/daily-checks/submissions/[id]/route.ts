import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/mobile/daily-checks/submissions/[id] - Get specific submission details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: submission, error } = await supabase
      .from("daily_check_submissions")
      .select(`
        *,
        form:daily_check_forms(*),
        vehicle:vehicles(vehicle_number, make, model, vehicle_type),
        issues:daily_check_issues(*)
      `)
      .eq("id", params.id)
      .eq("submitted_by", session.user.id) // Ensure user can only access their own submissions
      .single()

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      submission,
    })
  } catch (error) {
    console.error("Submission detail API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/mobile/daily-checks/submissions/[id] - Update submission (for offline sync)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const updateData = await request.json()

    // Only allow updating certain fields
    const allowedFields = ["checklist_responses", "notes", "post_trip_mileage", "shift_end_time", "signature_data"]

    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key]
        return obj
      }, {})

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data: submission, error } = await supabase
      .from("daily_check_submissions")
      .update({
        ...filteredData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("submitted_by", session.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      submission,
      message: "Submission updated successfully",
    })
  } catch (error) {
    console.error("Submission update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
