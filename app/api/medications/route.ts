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

const createMedicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  form: z.string().min(1, "Form is required"),
  lotNumber: z.string().min(1, "Lot number is required"),
  expiryDate: z.string().datetime("Invalid expiry date"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  isControlled: z.boolean().default(false),
  controlledClass: z.string().optional(),
  location: z.enum(["MAIN_SUPPLY", "VEHICLE"]),
  vehicleId: z.string().optional(),
})

// GET /api/medications - Get paginated medications
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const location = searchParams.get("filter[location]")
    const vehicleId = searchParams.get("filter[vehicleId]")
    const expiringSoon = searchParams.get("filter[expiringSoon]") === "true"
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (location) {
      where.location = location
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expiryDate = { lte: thirtyDaysFromNow }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { dosage: { contains: search, mode: "insensitive" } },
        { lotNumber: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get medications with pagination
    const [medications, total] = await Promise.all([
      db.medication.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              unitNumber: true,
              make: true,
              model: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { expiryDate: "asc" },
      }),
      db.medication.count({ where }),
    ])

    return createPaginatedResponse(medications, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/medications - Create new medication
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createMedicationSchema.parse(body)

    // Validate vehicle exists if location is VEHICLE
    if (validatedData.location === "VEHICLE") {
      if (!validatedData.vehicleId) {
        return createErrorResponse("Vehicle ID is required for vehicle location", 400)
      }

      const vehicle = await db.vehicle.findFirst({
        where: {
          id: validatedData.vehicleId,
          organizationId: context.organizationId,
        },
      })

      if (!vehicle) {
        return createErrorResponse("Vehicle not found", 404)
      }
    }

    const medication = await db.medication.create({
      data: {
        ...validatedData,
        expiryDate: new Date(validatedData.expiryDate),
        vehicleId: validatedData.location === "VEHICLE" ? validatedData.vehicleId : null,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            unitNumber: true,
            make: true,
            model: true,
          },
        },
      },
    })

    return createApiResponse(medication, "Medication created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
