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

const createMaintenanceSchema = z.object({
  type: z.enum([
    "OIL_CHANGE",
    "INSPECTION",
    "REPAIR",
    "PREVENTIVE",
    "EMERGENCY",
    "TIRE_ROTATION",
    "BRAKE_SERVICE",
    "TRANSMISSION",
    "ENGINE",
    "ELECTRICAL",
    "OTHER",
  ]),
  description: z.string().min(1, "Description is required"),
  cost: z.number().min(0).optional(),
  mileage: z.number().int().min(0),
  serviceDate: z.string().datetime(),
  nextDue: z.string().datetime().optional(),
  provider: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/fleet/vehicles/[id]/maintenance - Get vehicle maintenance records
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("filter[type]")

    const skip = (page - 1) * limit

    // Verify vehicle belongs to organization
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
    })

    if (!vehicle) {
      return createErrorResponse("Vehicle not found", 404)
    }

    // Build where clause
    const where: any = {
      vehicleId: params.id,
    }

    if (type) {
      where.type = type
    }

    // Get maintenance records with pagination
    const [records, total] = await Promise.all([
      db.maintenanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { serviceDate: "desc" },
      }),
      db.maintenanceRecord.count({ where }),
    ])

    return createPaginatedResponse(records, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/fleet/vehicles/[id]/maintenance - Create maintenance record
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createMaintenanceSchema.parse(body)

    // Verify vehicle belongs to organization
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
    })

    if (!vehicle) {
      return createErrorResponse("Vehicle not found", 404)
    }

    const record = await db.maintenanceRecord.create({
      data: {
        ...validatedData,
        vehicleId: params.id,
        serviceDate: new Date(validatedData.serviceDate),
        nextDue: validatedData.nextDue ? new Date(validatedData.nextDue) : null,
      },
    })

    return createApiResponse(record, "Maintenance record created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
