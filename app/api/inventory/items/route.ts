import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import {
  getApiContext,
  createPaginatedResponse,
  createApiResponse,
  createErrorResponse,
  handleApiError,
} from "@/lib/api-utils"
import { z } from "zod"

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.enum(["EMERGENCY", "CONSUMABLES", "EQUIPMENT", "MEDICATIONS", "SUPPLIES", "TOOLS", "OTHER"]),
  sku: z.string().optional(),
  currentStock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  expiryDate: z.string().datetime().optional(),
  lotNumber: z.string().optional(),
  supplier: z.string().optional(),
  locationId: z.string().optional(),
})

// GET /api/inventory/items - Get paginated inventory items
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("filter[category]")
    const search = searchParams.get("search")
    const lowStock = searchParams.get("filter[lowStock]") === "true"

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: context.organizationId,
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ]
    }

    if (lowStock) {
      where.currentStock = { lte: db.inventoryItem.fields.minStock }
    }

    // Get items with pagination
    const [items, total] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: {
          location: true,
        },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      db.inventoryItem.count({ where }),
    ])

    return createPaginatedResponse(items, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/inventory/items - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createItemSchema.parse(body)

    const item = await db.inventoryItem.create({
      data: {
        ...validatedData,
        organizationId: context.organizationId,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
      },
      include: {
        location: true,
      },
    })

    return createApiResponse(item, "Item created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
