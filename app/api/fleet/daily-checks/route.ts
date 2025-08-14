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

const createDailyCheckSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  shift: z.string().min(1, "Shift is required"),
  mileage: z.number().int().min(0),
  fuelLevel: z.number().min(0).max(100),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      checkItemId: z.string(),
      status: z.enum(["PASS", "FAIL", "NA"]),
      notes: z.string().optional(),
    }),
  ),
})

// GET /api/fleet/daily-checks - Get paginated daily checks
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const vehicleId = searchParams.get("vehicleId")
    const status = searchParams.get("filter[status]")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      vehicle: {
        organizationId: context.organizationId,
      },
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (status) {
      where.status = status
    }

    // Get daily checks with pagination
    const [checks, total] = await Promise.all([
      db.dailyCheck.findMany({
        where,
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              checkItem: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.dailyCheck.count({ where }),
    ])

    return createPaginatedResponse(checks, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/fleet/daily-checks - Create new daily check
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createDailyCheckSchema.parse(body)

    // Verify vehicle belongs to organization
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: validatedData.vehicleId,
        organizationId: context.organizationId,
      },
    })

    if (!vehicle) {
      return createErrorResponse("Vehicle not found", 404)
    }

    // Create daily check with items
    const dailyCheck = await db.dailyCheck.create({
      data: {
        vehicleId: validatedData.vehicleId,
        userId: context.userId,
        shift: validatedData.shift,
        mileage: validatedData.mileage,
        fuelLevel: validatedData.fuelLevel,
        notes: validatedData.notes,
        status: "COMPLETED",
        completedAt: new Date(),
        items: {
          create: validatedData.items.map((item) => ({
            checkItemId: item.checkItemId,
            status: item.status,
            notes: item.notes,
          })),
        },
      },
      include: {
        vehicle: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            checkItem: true,
          },
        },
      },
    })

    // Update vehicle mileage
    await db.vehicle.update({
      where: { id: validatedData.vehicleId },
      data: {
        mileage: validatedData.mileage,
        fuelLevel: validatedData.fuelLevel,
      },
    })

    return createApiResponse(dailyCheck, "Daily check completed successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
