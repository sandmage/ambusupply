import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"
import { z } from "zod"

const generateReportSchema = z.object({
  type: z.enum(["fleet", "inventory", "orders", "daily-checks", "maintenance", "medications"]),
  parameters: z.object({
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    filters: z.record(z.any()).optional(),
    format: z.enum(["json", "csv", "pdf"]).default("json"),
    includeCharts: z.boolean().default(false),
  }),
})

// POST /api/reports/generate - Generate custom report
export async function POST(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const { type, parameters } = generateReportSchema.parse(body)

    const startDate = new Date(parameters.dateRange.start)
    const endDate = new Date(parameters.dateRange.end)

    let reportData: any = {}

    switch (type) {
      case "fleet":
        reportData = await generateFleetReport(context.organizationId, startDate, endDate, parameters.filters)
        break

      case "inventory":
        reportData = await generateInventoryReport(context.organizationId, startDate, endDate, parameters.filters)
        break

      case "orders":
        reportData = await generateOrdersReport(context.organizationId, startDate, endDate, parameters.filters)
        break

      case "daily-checks":
        reportData = await generateDailyChecksReport(context.organizationId, startDate, endDate, parameters.filters)
        break

      case "maintenance":
        reportData = await generateMaintenanceReport(context.organizationId, startDate, endDate, parameters.filters)
        break

      case "medications":
        reportData = await generateMedicationsReport(context.organizationId, startDate, endDate, parameters.filters)
        break

      default:
        return createErrorResponse("Invalid report type", 400)
    }

    // Create report record
    const report = await db.$executeRaw`
      INSERT INTO reports (id, name, type, parameters, generated_by, generated_at, format)
      VALUES (gen_random_uuid(), ${`${type} Report - ${startDate.toDateString()}`}, ${type}, ${JSON.stringify(
        parameters,
      )}, ${context.userId}, NOW(), ${parameters.format})
    `

    const response = {
      id: `report_${Date.now()}`,
      type,
      generatedAt: new Date().toISOString(),
      parameters,
      data: reportData,
      summary: {
        totalRecords: Array.isArray(reportData.records) ? reportData.records.length : 0,
        dateRange: parameters.dateRange,
        filters: parameters.filters || {},
      },
    }

    return createApiResponse(response, "Report generated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions for different report types
async function generateFleetReport(organizationId: string, startDate: Date, endDate: Date, filters?: any) {
  const vehicles = await db.vehicle.findMany({
    where: {
      organizationId,
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      dailyChecks: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      maintenanceRecords: {
        where: {
          serviceDate: { gte: startDate, lte: endDate },
        },
      },
    },
  })

  return {
    records: vehicles,
    summary: {
      totalVehicles: vehicles.length,
      totalDailyChecks: vehicles.reduce((sum, v) => sum + v.dailyChecks.length, 0),
      totalMaintenanceRecords: vehicles.reduce((sum, v) => sum + v.maintenanceRecords.length, 0),
      averageMileage: Math.round(vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length),
    },
  }
}

async function generateInventoryReport(organizationId: string, startDate: Date, endDate: Date, filters?: any) {
  const items = await db.inventoryItem.findMany({
    where: {
      organizationId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.lowStock && { currentStock: { lte: db.inventoryItem.fields.minStock } }),
    },
    include: {
      location: true,
      stockMovements: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
    },
  })

  return {
    records: items,
    summary: {
      totalItems: items.length,
      totalStockMovements: items.reduce((sum, item) => sum + item.stockMovements.length, 0),
      lowStockItems: items.filter((item) => item.currentStock <= item.minStock).length,
      totalValue: items.reduce((sum, item) => sum + item.currentStock * (item.unitCost || 0), 0),
    },
  }
}

async function generateOrdersReport(organizationId: string, startDate: Date, endDate: Date, filters?: any) {
  const orders = await db.order.findMany({
    where: {
      organizationId,
      createdAt: { gte: startDate, lte: endDate },
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
    },
    include: {
      supplier: true,
      items: {
        include: {
          item: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return {
    records: orders,
    summary: {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length,
      ordersByStatus: orders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    },
  }
}

async function generateDailyChecksReport(organizationId: string, startDate: Date, endDate: Date, filters?: any) {
  const checks = await db.dailyCheck.findMany({
    where: {
      vehicle: { organizationId },
      createdAt: { gte: startDate, lte: endDate },
      ...(filters?.status && { status: filters.status }),
      ...(filters?.vehicleId && { vehicleId: filters.vehicleId }),
    },
    include: {
      vehicle: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        include: {
          checkItem: true,
        },
      },
    },
  })

  return {
    records: checks,
    summary: {
      totalChecks: checks.length,
      completedChecks: checks.filter((check) => check.status === "COMPLETED").length,
      failedChecks: checks.filter((check) => check.status === "FAILED").length,
      completionRate: (checks.filter((check) => check.status === "COMPLETED").length / checks.length) * 100,
    },
  }
}

async function generateMaintenanceReport(organizationId: string, startDate: Date, endDate: Date, filters?: any) {
  const records = await db.maintenanceRecord.findMany({
    where: {
      vehicle: { organizationId },
      serviceDate: { gte: startDate, lte: endDate },
      ...(filters?.type && { type: filters.type }),
    },
    include: {
      vehicle: true,
    },
  })

  return {
    records,
    summary: {
      totalRecords: records.length,
      totalCost: records.reduce((sum, record) => sum + (record.cost || 0), 0),
      averageCost: records.reduce((sum, record) => sum + (record.cost || 0), 0) / records.length,
      recordsByType: records.reduce(
        (acc, record) => {
          acc[record.type] = (acc[record.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    },
  }
}

async function generateMedicationsReport(organizationId: string, startDate: Date, endDate: Date, filters?: any) {
  const medications = await db.medication.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      ...(filters?.location && { location: filters.location }),
      ...(filters?.expiringSoon && {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      }),
    },
    include: {
      vehicle: {
        select: {
          unitNumber: true,
          make: true,
          model: true,
        },
      },
    },
  })

  return {
    records: medications,
    summary: {
      totalMedications: medications.length,
      controlledSubstances: medications.filter((med) => med.isControlled).length,
      expiringSoon: medications.filter((med) => med.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        .length,
      byLocation: medications.reduce(
        (acc, med) => {
          acc[med.location] = (acc[med.location] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    },
  }
}
