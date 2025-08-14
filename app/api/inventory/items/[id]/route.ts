import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, createErrorResponse, handleApiError } from "@/lib/api-utils"
import { z } from "zod"

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["EMERGENCY", "CONSUMABLES", "EQUIPMENT", "MEDICATIONS", "SUPPLIES", "TOOLS", "OTHER"]).optional(),
  sku: z.string().optional(),
  currentStock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  expiryDate: z.string().datetime().optional(),
  lotNumber: z.string().optional(),
  supplier: z.string().optional(),
  locationId: z.string().optional(),
})

// GET /api/inventory/items/[id] - Get single inventory item
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const item = await db.inventoryItem.findFirst({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
      include: {
        location: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!item) {
      return createErrorResponse("Item not found", 404)
    }

    return createApiResponse(item)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/inventory/items/[id] - Update inventory item
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = updateItemSchema.parse(body)

    const item = await db.inventoryItem.update({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
      data: {
        ...validatedData,
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : undefined,
      },
      include: {
        location: true,
      },
    })

    return createApiResponse(item, "Item updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/inventory/items/[id] - Delete inventory item
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    await db.inventoryItem.delete({
      where: {
        id: params.id,
        organizationId: context.organizationId,
      },
    })

    return createApiResponse(null, "Item deleted successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
