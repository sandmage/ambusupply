import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getApiContext, createApiResponse, handleApiError, createErrorResponse } from "@/lib/api-utils"
import { z } from "zod"

const updateSettingsSchema = z.object({
  general: z
    .object({
      organizationName: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
      theme: z.enum(["light", "dark", "auto"]).optional(),
    })
    .optional(),
  inventory: z
    .object({
      autoReorder: z.boolean().optional(),
      reorderThreshold: z.number().optional(),
      lowStockAlert: z.boolean().optional(),
      expirationAlert: z.boolean().optional(),
      expirationDays: z.number().optional(),
    })
    .optional(),
  fleet: z
    .object({
      maintenanceInterval: z.number().optional(),
      fuelThreshold: z.number().optional(),
      dailyCheckRequired: z.boolean().optional(),
      gpsTracking: z.boolean().optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
    })
    .optional(),
  security: z
    .object({
      sessionTimeout: z.number().optional(),
      twoFactorAuth: z.boolean().optional(),
      auditLog: z.boolean().optional(),
    })
    .optional(),
})

// GET /api/settings - Get organization settings
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const organization = await db.organization.findUnique({
      where: { id: context.organizationId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        timezone: true,
        settings: true,
      },
    })

    if (!organization) {
      return createErrorResponse("Organization not found", 404)
    }

    // Merge default settings with stored settings
    const defaultSettings = {
      general: {
        organizationName: organization.name,
        timezone: organization.timezone,
        dateFormat: "MM/dd/yyyy",
        currency: "USD",
        language: "en",
        theme: "light",
      },
      inventory: {
        autoReorder: false,
        reorderThreshold: 10,
        lowStockAlert: true,
        expirationAlert: true,
        expirationDays: 30,
      },
      fleet: {
        maintenanceInterval: 5000,
        fuelThreshold: 25,
        dailyCheckRequired: true,
        gpsTracking: true,
      },
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      security: {
        sessionTimeout: 480,
        twoFactorAuth: false,
        auditLog: true,
      },
    }

    const settings = {
      ...defaultSettings,
      ...((organization.settings as any) || {}),
    }

    return createApiResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/settings - Update organization settings
export async function PUT(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    // Check if user has admin role
    if (context.userRole !== "ADMIN") {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Get current settings
    const organization = await db.organization.findUnique({
      where: { id: context.organizationId },
      select: { settings: true },
    })

    if (!organization) {
      return createErrorResponse("Organization not found", 404)
    }

    // Merge with existing settings
    const currentSettings = (organization.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      ...validatedData,
    }

    // Update organization settings
    const updated = await db.organization.update({
      where: { id: context.organizationId },
      data: {
        settings: updatedSettings,
        // Update basic org info if provided
        ...(validatedData.general?.organizationName && { name: validatedData.general.organizationName }),
        ...(validatedData.general?.timezone && { timezone: validatedData.general.timezone }),
      },
      select: {
        id: true,
        name: true,
        timezone: true,
        settings: true,
      },
    })

    return createApiResponse(updated, "Settings updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
