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

const createVehicleSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  vin: z.string().min(17, "VIN must be 17 characters").max(17),
  licensePlate: z.string().min(1, "License plate is required"),
  mileage: z.number().int().min(0).default(0),
  status: z.enum(["IN_SERVICE", "OUT_OF_SERVICE", "MAINTENANCE", "REPAIR_SHOP", "RETIRED"]).default("IN_SERVICE"),
  fuelLevel: z.number().min(0).max(100).default(100),
})

// GET /api/fleet/vehicles - Get paginated vehicles
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("filter[status]")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: context.organizationId,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { unitNumber: { contains: search, mode: "insensitive" } },
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { licensePlate: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get vehicles with pagination
    const [vehicles, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include: {
          dailyChecks: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          maintenanceRecords: {
            orderBy: { serviceDate: "desc" },
            take: 1,
          },
          documents: {
            where: {
              expiryDate: {
                gte: new Date(),
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { unitNumber: "asc" },
      }),
      db.vehicle.count({ where }),
    ])

    return createPaginatedResponse(vehicles, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/fleet/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createVehicleSchema.parse(body)

    const vehicle = await db.vehicle.create({
      data: {
        ...validatedData,
        organizationId: context.organizationId,
      },
      include: {
        dailyChecks: true,
        maintenanceRecords: true,
        documents: true,
      },
    })

    return createApiResponse(vehicle, "Vehicle created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
