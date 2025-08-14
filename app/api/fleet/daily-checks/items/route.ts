import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"
import { z } from "zod"

const createCheckItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isRequired: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
})

// GET /api/fleet/daily-checks/items - Get daily check items
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("filter[category]")

    // Build where clause
    const where: any = {
      organizationId: context.organizationId,
    }

    if (category) {
      where.category = category
    }

    const items = await db.dailyCheckItem.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    })

    // Group by category
    const groupedItems = items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      },
      {} as Record<string, typeof items>,
    )

    return createApiResponse(groupedItems)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/fleet/daily-checks/items - Create new check item
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Check if user has admin role
    if (context.userRole !== "ADMIN") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = createCheckItemSchema.parse(body)

    const item = await db.dailyCheckItem.create({
      data: {
        ...validatedData,
        organizationId: context.organizationId,
      },
    })

    return createApiResponse(item, "Check item created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
