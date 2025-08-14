import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const result = await db.notification.updateMany({
      where: {
        userId: context.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return createApiResponse({ count: result.count }, `Marked ${result.count} notifications as read`)
  } catch (error) {
    return handleApiError(error)
  }
}
