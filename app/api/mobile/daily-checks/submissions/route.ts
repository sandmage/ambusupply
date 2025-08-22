import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/mobile/daily-checks/submissions - Submit daily check from mobile
export async function POST(request: NextRequest) {
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

    const submissionData = await request.json()

    // Validate required fields
    const requiredFields = ["form_id", "vehicle_id", "checklist_responses"]
    for (const field of requiredFields) {
      if (!submissionData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Get the form to validate responses
    const { data: form, error: formError } = await supabase
      .from("daily_check_forms")
      .select("*")
      .eq("id", submissionData.form_id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: "Invalid form ID" }, { status: 400 })
    }

    // Validate required checklist items
    const requiredItems = form.checklist_items.filter((item: any) => item.required)
    const missingRequired = requiredItems.filter(
      (item: any) => !submissionData.checklist_responses[item.id] && submissionData.checklist_responses[item.id] !== 0,
    )

    if (missingRequired.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missing_fields: missingRequired.map((item: any) => item.label),
        },
        { status: 400 },
      )
    }

    // Determine overall status and issues
    let overallStatus: "pass" | "fail" | "conditional" = "pass"
    const issues: string[] = []

    form.checklist_items.forEach((item: any) => {
      const response = submissionData.checklist_responses[item.id]
      if (item.type === "checkbox" && !response) {
        issues.push(`${item.label}: Not checked`)
        overallStatus = "fail"
      }
    })

    // Prepare submission data
    const finalSubmissionData = {
      ...submissionData,
      submitted_by: session.user.id,
      submitted_at: new Date().toISOString(),
      submission_date: submissionData.submission_date || new Date().toISOString().split("T")[0],
      overall_status: overallStatus,
      issues_found: issues,
    }

    // Insert submission
    const { data: submission, error: insertError } = await supabase
      .from("daily_check_submissions")
      .insert([finalSubmissionData])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Create issue records if any
    if (issues.length > 0) {
      const issueRecords = issues.map((issue, index) => ({
        submission_id: submission.id,
        checklist_item_id: `issue_${index}`,
        issue_type: "fail",
        description: issue,
        severity: "medium",
      }))

      await supabase.from("daily_check_issues").insert(issueRecords)
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        overall_status: submission.overall_status,
        issues_found: submission.issues_found,
        submitted_at: submission.submitted_at,
      },
      message: "Daily check submitted successfully",
    })
  } catch (error) {
    console.error("Daily check submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/mobile/daily-checks/submissions - Get user's submissions
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
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const vehicleId = searchParams.get("vehicle_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")

    let query = supabase
      .from("daily_check_submissions")
      .select(`
        id,
        form_id,
        vehicle_id,
        submission_date,
        overall_status,
        issues_found,
        submitted_at,
        form:daily_check_forms(name),
        vehicle:vehicles(vehicle_number, make, model)
      `)
      .eq("submitted_by", session.user.id)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    }

    if (dateFrom) {
      query = query.gte("submission_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("submission_date", dateTo)
    }

    const { data: submissions, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      submissions: submissions || [],
      count: submissions?.length || 0,
      has_more: submissions?.length === limit,
    })
  } catch (error) {
    console.error("Daily check submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
