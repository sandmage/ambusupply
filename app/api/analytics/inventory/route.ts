import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// GET /api/analytics/inventory - Get inventory analytics
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days

    const daysAgo = Number.parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Parallel queries for inventory analytics
    const [itemsByCategory, stockLevels, stockMovements, expiringItems, lowStockItems, totalValue, topItems] =
      await Promise.all([
        // Items by category
        db.inventoryItem.groupBy({
          by: ["category"],
          where: { organizationId: context.organizationId },
          _count: true,
          _sum: { currentStock: true },
        }),

        // Stock level distribution
        db.inventoryItem.findMany({
          where: { organizationId: context.organizationId },
          select: {
            id: true,
            name: true,
            currentStock: true,
            minStock: true,
            maxStock: true,
            category: true,
          },
        }),

        // Stock movements over time
        db.stockMovement.findMany({
          where: {
            item: { organizationId: context.organizationId },
            createdAt: { gte: startDate },
          },
          select: {
            type: true,
            quantity: true,
            createdAt: true,
            item: {
              select: { name: true, category: true },
            },
          },
          orderBy: { createdAt: "asc" },
        }),

        // Items expiring soon
        db.inventoryItem.count({
          where: {
            organizationId: context.organizationId,
            expiryDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              gte: new Date(),
            },
          },
        }),

        // Low stock items
        db.inventoryItem.count({
          where: {
            organizationId: context.organizationId,
            currentStock: { lte: db.inventoryItem.fields.minStock },
          },
        }),

        // Total inventory value
        db.inventoryItem.aggregate({
          where: { organizationId: context.organizationId },
          _sum: {
            currentStock: true,
          },
        }),

        // Top items by usage (stock movements)
        db.stockMovement.groupBy({
          by: ["itemId"],
          where: {
            item: { organizationId: context.organizationId },
            createdAt: { gte: startDate },
            type: "OUT",
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 10,
        }),
      ])

    // Process data for charts
    const categoryChart = {
      type: "pie" as const,
      title: "Items by Category",
      data: itemsByCategory.map((item) => ({
        name: item.category.replace("_", " "),
        value: item._count,
        stock: item._sum.currentStock || 0,
      })),
    }

    // Stock level analysis
    const stockAnalysis = stockLevels.map((item) => {
      const stockPercentage = item.maxStock ? (item.currentStock / item.maxStock) * 100 : 100
      let status: "good" | "warning" | "critical" = "good"

      if (item.currentStock <= item.minStock) {
        status = "critical"
      } else if (stockPercentage < 25) {
        status = "warning"
      }

      return {
        ...item,
        stockPercentage: Math.round(stockPercentage),
        status,
      }
    })

    const stockLevelChart = {
      type: "bar" as const,
      title: "Stock Levels by Item",
      data: stockAnalysis.slice(0, 15).map((item) => ({
        name: item.name.substring(0, 20),
        current: item.currentStock,
        min: item.minStock,
        max: item.maxStock || item.minStock * 2,
        status: item.status,
      })),
    }

    // Stock movement trend
    const movementTrend = stockMovements.reduce(
      (acc, movement) => {
        const date = movement.createdAt.toISOString().split("T")[0]
        if (!acc[date]) {
          acc[date] = { date, in: 0, out: 0, adjustment: 0 }
        }

        if (movement.type === "IN") {
          acc[date].in += movement.quantity
        } else if (movement.type === "OUT") {
          acc[date].out += movement.quantity
        } else {
          acc[date].adjustment += movement.quantity
        }

        return acc
      },
      {} as Record<string, { date: string; in: number; out: number; adjustment: number }>,
    )

    const movementChart = {
      type: "line" as const,
      title: "Stock Movement Trend",
      data: Object.values(movementTrend),
    }

    // Get top item details
    const topItemsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const details = await db.inventoryItem.findUnique({
          where: { id: item.itemId },
          select: { name: true, category: true },
        })
        return {
          name: details?.name || "Unknown",
          category: details?.category || "OTHER",
          usage: item._sum.quantity || 0,
        }
      }),
    )

    const analytics = {
      charts: [categoryChart, stockLevelChart, movementChart],
      metrics: [
        {
          name: "Total Items",
          value: stockLevels.length,
          unit: "items",
          status: "info" as const,
        },
        {
          name: "Low Stock Items",
          value: lowStockItems,
          unit: "items",
          status: lowStockItems > 0 ? ("warning" as const) : ("good" as const),
        },
        {
          name: "Expiring Soon",
          value: expiringItems,
          unit: "items",
          status: expiringItems > 0 ? ("warning" as const) : ("good" as const),
        },
        {
          name: "Total Stock Units",
          value: totalValue._sum.currentStock || 0,
          unit: "units",
          status: "info" as const,
        },
      ],
      topItems: topItemsWithDetails,
      stockAnalysis: stockAnalysis.filter((item) => item.status !== "good").slice(0, 10),
      period: `${period} days`,
    }

    return createApiResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
