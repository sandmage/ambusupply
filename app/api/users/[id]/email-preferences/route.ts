import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateEmailPreferencesSchema = z.object({
  enableEmailNotifications: z.boolean().optional(),
  lowStockAlerts: z.boolean().optional(),
  maintenanceAlerts: z.boolean().optional(),
  orderNotifications: z.boolean().optional(),
  medicationAlerts: z.boolean().optional(),
  emergencyAlerts: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
  urgentOnly: z.boolean().optional(),
  highPriorityOnly: z.boolean().optional(),
  digestMode: z.boolean().optional(),
  digestFrequency: z.enum(["DAILY", "WEEKLY", "NEVER"]).optional(),
})

// GET /api/users/[id]/email-preferences - Get user email preferences
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const userId = params.id

    // Users can only access their own preferences unless they're admin
    if (context.userId !== userId && context.userRole !== "ADMIN") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    // Get or create email preferences
    let preferences = await db.emailPreferences.findUnique({
      where: { userId },
    })

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await db.emailPreferences.create({
        data: { userId },
      })
    }

    return createApiResponse(preferences)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/users/[id]/email-preferences - Update user email preferences
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const userId = params.id

    // Users can only update their own preferences unless they're admin
    if (context.userId !== userId && context.userRole !== "ADMIN") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateEmailPreferencesSchema.parse(body)

    // Update or create email preferences
    const preferences = await db.emailPreferences.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
      },
    })

    return createApiResponse(preferences, "Email preferences updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
