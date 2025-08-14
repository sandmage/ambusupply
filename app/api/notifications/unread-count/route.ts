import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// GET /api/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const count = await db.notification.count({
      where: {
        userId: context.userId,
        isRead: false,
      },
    })

    return createApiResponse({ count })
  } catch (error) {
    return handleApiError(error)
  }
}
