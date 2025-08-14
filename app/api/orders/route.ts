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

const createOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  notes: z.string().optional(),
  expectedDate: z.string().datetime().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      }),
    )
    .min(1, "At least one item is required"),
})

// GET /api/orders - Get paginated orders
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
    const priority = searchParams.get("filter[priority]")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId: context.organizationId,
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          supplier: true,
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
              item: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.order.count({ where }),
    ])

    return createPaginatedResponse(orders, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Generate order number
    const orderCount = await db.order.count({
      where: { organizationId: context.organizationId },
    })
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, "0")}`

    // Calculate total amount
    const totalAmount = validatedData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        organizationId: context.organizationId,
        supplierId: validatedData.supplierId,
        userId: context.userId,
        priority: validatedData.priority,
        totalAmount,
        notes: validatedData.notes,
        expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : null,
        items: {
          create: validatedData.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
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
            item: true,
          },
        },
      },
    })

    return createApiResponse(order, "Order created successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
