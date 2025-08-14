import { type NextRequest, NextResponse } from "next/server"
import { ActivityService } from "@/lib/services/activity-service"
import { getApiContext } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const context = await getApiContext(request)
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const activities = await ActivityService.getRecentActivities(limit)

    return NextResponse.json({
      success: true,
      data: activities,
      message: "Activities retrieved successfully",
    })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activities",
        message: "An error occurred while retrieving activities",
      },
      { status: 500 },
    )
  }
}
