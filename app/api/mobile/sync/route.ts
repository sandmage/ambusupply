import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/mobile/sync - Handle offline sync from mobile app
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

    const { submissions, lastSync } = await request.json()

    if (!Array.isArray(submissions)) {
      return NextResponse.json({ error: "Submissions must be an array" }, { status: 400 })
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      conflicts: [] as any[],
    }

    // Process each submission
    for (const submission of submissions) {
      try {
        // Check if submission already exists
        const { data: existing } = await supabase
          .from("daily_check_submissions")
          .select("id, updated_at")
          .eq("id", submission.id)
          .single()

        if (existing) {
          // Handle conflict resolution
          const existingUpdated = new Date(existing.updated_at)
          const submissionUpdated = new Date(submission.updated_at || submission.submitted_at)

          if (existingUpdated > submissionUpdated) {
            // Server version is newer, mark as conflict
            results.conflicts.push({
              id: submission.id,
              reason: "Server version is newer",
              server_version: existing,
            })
            continue
          }

          // Update existing submission
          const { error: updateError } = await supabase
            .from("daily_check_submissions")
            .update({
              ...submission,
              updated_at: new Date().toISOString(),
            })
            .eq("id", submission.id)

          if (updateError) {
            results.failed.push({
              id: submission.id,
              error: updateError.message,
            })
          } else {
            results.successful.push({
              id: submission.id,
              action: "updated",
            })
          }
        } else {
          // Create new submission
          const { error: insertError } = await supabase.from("daily_check_submissions").insert([
            {
              ...submission,
              submitted_by: session.user.id,
              submitted_at: submission.submitted_at || new Date().toISOString(),
            },
          ])

          if (insertError) {
            results.failed.push({
              id: submission.id,
              error: insertError.message,
            })
          } else {
            results.successful.push({
              id: submission.id,
              action: "created",
            })
          }
        }
      } catch (error) {
        results.failed.push({
          id: submission.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Get any server-side changes since last sync
    let serverChanges = []
    if (lastSync) {
      const { data: changes } = await supabase
        .from("daily_check_submissions")
        .select("*")
        .eq("submitted_by", session.user.id)
        .gte("updated_at", lastSync)

      serverChanges = changes || []
    }

    return NextResponse.json({
      success: true,
      sync_results: results,
      server_changes: serverChanges,
      sync_timestamp: new Date().toISOString(),
      message: `Sync completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.conflicts.length} conflicts`,
    })
  } catch (error) {
    console.error("Sync API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/mobile/sync - Get sync status and pending changes
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
    const lastSync = searchParams.get("last_sync")

    // Get forms that have been updated since last sync
    let formsQuery = supabase.from("daily_check_forms").select("*").eq("is_active", true)

    if (lastSync) {
      formsQuery = formsQuery.gte("updated_at", lastSync)
    }

    const { data: updatedForms } = await formsQuery

    // Get user's submissions that have been updated since last sync
    let submissionsQuery = supabase.from("daily_check_submissions").select("*").eq("submitted_by", session.user.id)

    if (lastSync) {
      submissionsQuery = submissionsQuery.gte("updated_at", lastSync)
    }

    const { data: updatedSubmissions } = await submissionsQuery

    return NextResponse.json({
      success: true,
      updated_forms: updatedForms || [],
      updated_submissions: updatedSubmissions || [],
      server_timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Sync status API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
