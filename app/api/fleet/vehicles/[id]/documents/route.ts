import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"
import { z } from "zod"

const createDocumentSchema = z.object({
  type: z.enum(["REGISTRATION", "INSURANCE", "INSPECTION", "LICENSE", "PERMIT", "WARRANTY", "OTHER"]),
  name: z.string().min(1, "Name is required"),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  documentUrl: z.string().url().optional(),
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/fleet/vehicles/[id]/documents - Get vehicle documents
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("filter[type]")
    const expiringSoon = searchParams.get("filter[expiringSoon]") === "true"

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

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      }
    }

    const documents = await db.vehicleDocument.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    })

    return createApiResponse(documents)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/fleet/vehicles/[id]/documents - Create vehicle document
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createDocumentSchema.parse(body)

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

    const document = await db.vehicleDocument.create({
      data: {
        ...validatedData,
        vehicleId: params.id,
        issueDate: new Date(validatedData.issueDate),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      },
    })

    return createApiResponse(document, "Document created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
