import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// GET /api/analytics/orders - Get order analytics
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

    // Parallel queries for order analytics
    const [ordersByStatus, ordersByPriority, orderTrend, supplierSpending, totalSpending, avgOrderValue] =
      await Promise.all([
        // Orders by status
        db.order.groupBy({
          by: ["status"],
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startDate },
          },
          _count: true,
          _sum: { totalAmount: true },
        }),

        // Orders by priority
        db.order.groupBy({
          by: ["priority"],
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startDate },
          },
          _count: true,
          _sum: { totalAmount: true },
        }),

        // Order trend over time
        db.order.findMany({
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startDate },
          },
          select: {
            createdAt: true,
            totalAmount: true,
            status: true,
          },
          orderBy: { createdAt: "asc" },
        }),

        // Spending by supplier
        db.order.groupBy({
          by: ["supplierId"],
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startDate },
            status: { in: ["RECEIVED", "DELIVERED"] },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),

        // Total spending
        db.order.aggregate({
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startDate },
            status: { in: ["RECEIVED", "DELIVERED"] },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),

        // Average order value
        db.order.aggregate({
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startDate },
          },
          _avg: { totalAmount: true },
        }),
      ])

    // Process data for charts
    const statusChart = {
      type: "pie" as const,
      title: "Orders by Status",
      data: ordersByStatus.map((item) => ({
        name: item.status.replace("_", " "),
        value: item._count,
        amount: item._sum.totalAmount || 0,
      })),
    }

    const priorityChart = {
      type: "bar" as const,
      title: "Orders by Priority",
      data: ordersByPriority.map((item) => ({
        name: item.priority,
        value: item._count,
        amount: item._sum.totalAmount || 0,
      })),
    }

    // Order trend by day
    const trendData = orderTrend.reduce(
      (acc, order) => {
        const date = order.createdAt.toISOString().split("T")[0]
        if (!acc[date]) {
          acc[date] = { date, orders: 0, amount: 0 }
        }
        acc[date].orders++
        acc[date].amount += order.totalAmount
        return acc
      },
      {} as Record<string, { date: string; orders: number; amount: number }>,
    )

    const trendChart = {
      type: "line" as const,
      title: "Order Volume & Spending Trend",
      data: Object.values(trendData),
    }

    // Get supplier details for spending chart
    const supplierDetails = await Promise.all(
      supplierSpending.slice(0, 10).map(async (item) => {
        const supplier = await db.supplier.findUnique({
          where: { id: item.supplierId },
          select: { name: true },
        })
        return {
          name: supplier?.name || "Unknown Supplier",
          amount: item._sum.totalAmount || 0,
          orders: item._count,
        }
      }),
    )

    const supplierChart = {
      type: "bar" as const,
      title: "Supplier Spending",
      data: supplierDetails,
    }

    const analytics = {
      charts: [statusChart, priorityChart, trendChart, supplierChart],
      metrics: [
        {
          name: "Total Orders",
          value: totalSpending._count || 0,
          unit: "orders",
          status: "info" as const,
        },
        {
          name: "Total Spending",
          value: totalSpending._sum.totalAmount || 0,
          unit: "$",
          status: "info" as const,
        },
        {
          name: "Average Order Value",
          value: Math.round(avgOrderValue._avg.totalAmount || 0),
          unit: "$",
          status: "info" as const,
        },
        {
          name: "Pending Orders",
          value: ordersByStatus.find((o) => o.status === "PENDING")?._count || 0,
          unit: "orders",
          status:
            (ordersByStatus.find((o) => o.status === "PENDING")?._count || 0) > 5
              ? ("warning" as const)
              : ("good" as const),
        },
      ],
      topSuppliers: supplierDetails.slice(0, 5),
      period: `${period} days`,
    }

    return createApiResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
