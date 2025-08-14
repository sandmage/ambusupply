import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export interface ApiContext {
  userId: string
  userRole: string
  organizationId: string
}

export function getApiContext(request: NextRequest): ApiContext | null {
  // Try server-side headers first (for production)
  const userId = request.headers.get("x-user-id")
  const userRole = request.headers.get("x-user-role")
  const organizationId = request.headers.get("x-organization-id")

  if (userId && userRole && organizationId) {
    return { userId, userRole, organizationId }
  }

  // Fallback for v0 environment - use mock context
  return {
    userId: "1",
    userRole: "ADMIN",
    organizationId: "1",
  }
}

export function createApiResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  })
}

export function createErrorResponse(error: string, status = 500, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString(),
    },
    { status },
  )
}

export function createPaginatedResponse<T>(data: T[], page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  })
}

export async function handleApiError(error: any) {
  console.error("API Error:", error)

  if (error instanceof z.ZodError) {
    return createErrorResponse("Invalid input data", 400, error.errors)
  }

  return createErrorResponse("Internal server error", 500)
}
