import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import {
  getApiContext,
  createPaginatedResponse,
  createApiResponse,
  handleApiError,
  createErrorResponse,
} from "@/lib/api-utils"
import { emailService } from "@/lib/email/email-service"
import { z } from "zod"

const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["INFO", "WARNING", "ERROR", "SUCCESS"]).default("INFO"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  data: z.record(z.any()).optional(),
  sendEmail: z.boolean().default(false),
  actionUrl: z.string().optional(),
})

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const context = getApiContext(request)
    if (!context) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const unreadOnly = searchParams.get("filter[unread]") === "true"
    const type = searchParams.get("filter[type]")

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: context.userId,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    if (type) {
      where.type = type
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.notification.count({ where }),
    ])

    return createPaginatedResponse(notifications, page, limit, total)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/notifications - Create notification (admin only)
export async function POST(request: NextRequest) {
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
    const validatedData = createNotificationSchema.parse(body)

    // Get all users in organization to send notification to
    const users = await db.user.findMany({
      where: {
        organizationId: context.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map((user) =>
        db.notification.create({
          data: {
            title: validatedData.title,
            message: validatedData.message,
            type: validatedData.type,
            priority: validatedData.priority,
            data: validatedData.data,
            userId: user.id,
          },
        }),
      ),
    )

    if (validatedData.sendEmail && emailService.isReady()) {
      const emailPromises = users.map(async (user) => {
        try {
          await emailService.sendNotificationEmail(user.email, {
            type: validatedData.type as any,
            priority: validatedData.priority as any,
            title: validatedData.title,
            message: validatedData.message,
            data: validatedData.data,
            actionUrl: validatedData.actionUrl,
          })
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError)
        }
      })

      // Send emails in parallel but don't wait for them to complete
      Promise.allSettled(emailPromises).then((results) => {
        const successful = results.filter((r) => r.status === "fulfilled").length
        const failed = results.filter((r) => r.status === "rejected").length
        console.log(`Email notifications: ${successful} sent, ${failed} failed`)
      })
    }

    return createApiResponse(
      {
        count: notifications.length,
        emailSent: validatedData.sendEmail && emailService.isReady(),
      },
      `Notification sent to ${notifications.length} users${validatedData.sendEmail ? " (with email)" : ""}`,
    )
  } catch (error) {
    return handleApiError(error)
  }
}
