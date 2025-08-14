import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"

// GET /api/analytics/fleet - Get fleet analytics
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

    // Parallel queries for fleet analytics
    const [vehiclesByStatus, utilizationData, maintenanceData, dailyCheckData, fuelData] = await Promise.all([
      // Vehicle status distribution
      db.vehicle.groupBy({
        by: ["status"],
        where: { organizationId: context.organizationId },
        _count: true,
      }),

      // Vehicle utilization (based on daily checks)
      db.dailyCheck.groupBy({
        by: ["vehicleId"],
        where: {
          vehicle: { organizationId: context.organizationId },
          createdAt: { gte: startDate },
        },
        _count: true,
      }),

      // Maintenance costs by type
      db.maintenanceRecord.groupBy({
        by: ["type"],
        where: {
          vehicle: { organizationId: context.organizationId },
          serviceDate: { gte: startDate },
        },
        _sum: { cost: true },
        _count: true,
      }),

      // Daily check completion trend
      db.dailyCheck.findMany({
        where: {
          vehicle: { organizationId: context.organizationId },
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          status: true,
          vehicleId: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      // Average fuel levels
      db.dailyCheck.aggregate({
        where: {
          vehicle: { organizationId: context.organizationId },
          createdAt: { gte: startDate },
        },
        _avg: { fuelLevel: true },
      }),
    ])

    // Process data for charts
    const statusChart = {
      type: "pie" as const,
      title: "Vehicle Status Distribution",
      data: vehiclesByStatus.map((item) => ({
        name: item.status.replace("_", " "),
        value: item._count,
      })),
    }

    const utilizationChart = {
      type: "bar" as const,
      title: "Vehicle Utilization",
      data: utilizationData.slice(0, 10).map((item, index) => ({
        name: `Vehicle ${index + 1}`,
        value: item._count,
      })),
    }

    const maintenanceChart = {
      type: "bar" as const,
      title: "Maintenance Costs by Type",
      data: maintenanceData.map((item) => ({
        name: item.type.replace("_", " "),
        value: item._sum.cost || 0,
        count: item._count,
      })),
    }

    // Group daily checks by date
    const dailyCheckTrend = dailyCheckData.reduce(
      (acc, check) => {
        const date = check.createdAt.toISOString().split("T")[0]
        if (!acc[date]) {
          acc[date] = { date, completed: 0, total: 0 }
        }
        acc[date].total++
        if (check.status === "COMPLETED") {
          acc[date].completed++
        }
        return acc
      },
      {} as Record<string, { date: string; completed: number; total: number }>,
    )

    const trendChart = {
      type: "line" as const,
      title: "Daily Check Completion Trend",
      data: Object.values(dailyCheckTrend).map((item) => ({
        date: item.date,
        completed: item.completed,
        total: item.total,
        rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
      })),
    }

    const analytics = {
      charts: [statusChart, utilizationChart, maintenanceChart, trendChart],
      metrics: [
        {
          name: "Average Fuel Level",
          value: Math.round(fuelData._avg.fuelLevel || 0),
          unit: "%",
          status: (fuelData._avg.fuelLevel || 0) >= 50 ? ("good" as const) : ("warning" as const),
        },
        {
          name: "Total Maintenance Cost",
          value: maintenanceData.reduce((sum, item) => sum + (item._sum.cost || 0), 0),
          unit: "$",
          status: "info" as const,
        },
        {
          name: "Active Vehicles",
          value: vehiclesByStatus.find((v) => v.status === "IN_SERVICE")?._count || 0,
          unit: "vehicles",
          status: "good" as const,
        },
      ],
      period: `${period} days`,
    }

    return createApiResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
