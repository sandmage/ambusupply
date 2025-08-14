import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// GET /api/analytics/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Get current date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    // Parallel queries for dashboard metrics
    const [
      totalVehicles,
      activeVehicles,
      totalInventoryItems,
      lowStockItems,
      totalOrders,
      pendingOrders,
      completedDailyChecks,
      totalDailyChecks,
      recentAlerts,
      monthlyOrderValue,
      weeklyDailyChecks,
    ] = await Promise.all([
      // Vehicle metrics
      db.vehicle.count({
        where: { organizationId: context.organizationId },
      }),
      db.vehicle.count({
        where: {
          organizationId: context.organizationId,
          status: "IN_SERVICE",
        },
      }),

      // Inventory metrics
      db.inventoryItem.count({
        where: { organizationId: context.organizationId },
      }),
      db.inventoryItem.count({
        where: {
          organizationId: context.organizationId,
          currentStock: { lte: db.inventoryItem.fields.minStock },
        },
      }),

      // Order metrics
      db.order.count({
        where: { organizationId: context.organizationId },
      }),
      db.order.count({
        where: {
          organizationId: context.organizationId,
          status: "PENDING",
        },
      }),

      // Daily check metrics
      db.dailyCheck.count({
        where: {
          vehicle: { organizationId: context.organizationId },
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
      }),
      db.dailyCheck.count({
        where: {
          vehicle: { organizationId: context.organizationId },
          createdAt: { gte: startOfMonth },
        },
      }),

      // Recent alerts (medications expiring, low stock, etc.)
      db.medication.count({
        where: {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            gte: new Date(),
          },
        },
      }),

      // Monthly order value
      db.order.aggregate({
        where: {
          organizationId: context.organizationId,
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),

      // Weekly daily checks trend
      db.dailyCheck.groupBy({
        by: ["createdAt"],
        where: {
          vehicle: { organizationId: context.organizationId },
          createdAt: { gte: startOfWeek },
        },
        _count: true,
      }),
    ])

    // Calculate completion rate
    const dailyCheckCompletionRate = totalDailyChecks > 0 ? (completedDailyChecks / totalDailyChecks) * 100 : 0

    // Build response
    const analytics = {
      metrics: [
        {
          name: "Active Vehicles",
          value: activeVehicles,
          total: totalVehicles,
          unit: "vehicles",
          change: 0, // Would need historical data to calculate
          changeType: "stable" as const,
          status: "good" as const,
        },
        {
          name: "Inventory Items",
          value: totalInventoryItems - lowStockItems,
          total: totalInventoryItems,
          unit: "items",
          change: 0,
          changeType: "stable" as const,
          status: lowStockItems > 0 ? ("warning" as const) : ("good" as const),
        },
        {
          name: "Pending Orders",
          value: pendingOrders,
          total: totalOrders,
          unit: "orders",
          change: 0,
          changeType: "stable" as const,
          status: pendingOrders > 5 ? ("warning" as const) : ("good" as const),
        },
        {
          name: "Daily Check Rate",
          value: Math.round(dailyCheckCompletionRate),
          unit: "%",
          change: 0,
          changeType: "stable" as const,
          status: dailyCheckCompletionRate >= 90 ? ("good" as const) : ("warning" as const),
        },
      ],
      alerts: {
        critical: 0,
        warning: lowStockItems + recentAlerts,
        info: 0,
      },
      trends: {
        monthlyOrderValue: monthlyOrderValue._sum.totalAmount || 0,
        weeklyDailyChecks: weeklyDailyChecks.length,
      },
    }

    return createApiResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
