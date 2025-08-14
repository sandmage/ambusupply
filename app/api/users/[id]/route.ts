import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const userId = params.id

    // Users can only access their own data unless they're admin
    if (context.userId !== userId && context.userRole !== "ADMIN") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
      },
    })

    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    return createApiResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}
