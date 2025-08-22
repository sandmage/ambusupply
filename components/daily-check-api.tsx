"use client"

import { createClient } from "@/lib/supabase/client"

export class DailyCheckAPI {
  private supabase = createClient()

  async submitDailyCheck(submission: any) {
    try {
      const { data, error } = await this.supabase.from("daily_check_submissions").insert([submission]).select().single()

      if (error) throw error

      // Create individual issue records if any
      if (submission.issues_found?.length > 0) {
        const issues = submission.issues_found.map((issue: string, index: number) => ({
          submission_id: data.id,
          checklist_item_id: `issue_${index}`,
          issue_type: "fail",
          description: issue,
          severity: "medium",
        }))

        await this.supabase.from("daily_check_issues").insert(issues)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getDailyCheckForms(vehicleType?: string) {
    let query = this.supabase.from("daily_check_forms").select("*").eq("is_active", true)

    if (vehicleType) {
      query = query.contains("vehicle_types", [vehicleType])
    }

    return await query.order("name")
  }

  async getDailyCheckSubmissions(filters?: { vehicleId?: string; dateFrom?: string; dateTo?: string }) {
    let query = this.supabase.from("daily_check_submissions").select(`
        *,
        form:daily_check_forms(name),
        vehicle:vehicles(vehicle_number, make, model),
        submitted_by_profile:profiles(first_name, last_name)
      `)

    if (filters?.vehicleId) {
      query = query.eq("vehicle_id", filters.vehicleId)
    }

    if (filters?.dateFrom) {
      query = query.gte("submission_date", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("submission_date", filters.dateTo)
    }

    return await query.order("submitted_at", { ascending: false })
  }

  async getSubmissionIssues(submissionId: string) {
    return await this.supabase
      .from("daily_check_issues")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at")
  }

  async resolveIssue(issueId: string, resolutionNotes: string) {
    return await this.supabase
      .from("daily_check_issues")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq("id", issueId)
  }
}

export const dailyCheckAPI = new DailyCheckAPI()
