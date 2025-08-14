import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// PATCH /api/notifications/[id]/read - Mark notification as read
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const notification = await db.notification.update({
      where: {
        id: params.id,
        userId: context.userId,
      },
      data: {
        isRead: true,
      },
    })

    return createApiResponse(notification, "Notification marked as read")
  } catch (error) {
    return handleApiError(error)
  }
}
