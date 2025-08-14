import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import {
  getApiContext,
  createPaginatedResponse,
  createApiResponse,
  handleApiError,
  createErrorResponse,
} from "@/lib/api-utils"
import { z } from "zod"

const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["BUILDING", "ROOM", "CABINET", "SHELF", "CONTAINER", "VEHICLE", "OTHER"]),
  description: z.string().optional(),
  capacity: z.number().int().min(0).optional(),
  parentId: z.string().optional(),
})

// GET /api/locations - Get paginated locations
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("filter[type]")
    const parentId = searchParams.get("filter[parentId]")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: context.organizationId,
    }

    if (type) {
      where.type = type
    }

    if (parentId) {
      where.parentId = parentId
    }

    // Get locations with pagination
    const [locations, total] = await Promise.all([
      db.location.findMany({
        where,
        include: {
          parent: true,
          children: true,
          inventoryItems: {
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      db.location.count({ where }),
    ])

    return createPaginatedResponse(locations, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createLocationSchema.parse(body)

    // Verify parent location exists if provided
    if (validatedData.parentId) {
      const parentLocation = await db.location.findFirst({
        where: {
          id: validatedData.parentId,
          organizationId: context.organizationId,
        },
      })

      if (!parentLocation) {
        return createErrorResponse("Parent location not found", 404)
      }
    }

    const location = await db.location.create({
      data: {
        ...validatedData,
        organizationId: context.organizationId,
      },
      include: {
        parent: true,
        children: true,
        inventoryItems: {
          select: {
            id: true,
            name: true,
            currentStock: true,
          },
        },
      },
    })

    return createApiResponse(location, "Location created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
