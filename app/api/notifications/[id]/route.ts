import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    await db.notification.delete({
      where: {
        id: params.id,
        userId: context.userId,
      },
    })

    return createApiResponse(null, "Notification deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
