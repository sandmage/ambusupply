"use client"

import { notificationsService } from "@/lib/api/services"
import { emailService } from "@/lib/email/email-service"

export interface NotificationData {
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  data?: any
  sendEmail?: boolean
  actionUrl?: string
}

class NotificationService {
  private static instance: NotificationService
  private streams = new Map<string, ReadableStreamDefaultController>()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendToUser(userId: string, notification: NotificationData) {
    try {
      // Create notification in database
      await notificationsService.createNotification({
        ...notification,
        userId,
      })

      if (notification.sendEmail && emailService.isReady()) {
        try {
          // Get user email from API
          const userResponse = await fetch(`/api/users/${userId}`)
          if (userResponse.ok) {
            const user = await userResponse.json()
            if (user.email) {
              await emailService.sendNotificationEmail(user.email, {
                type: notification.type as any,
                priority: notification.priority as any,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                actionUrl: notification.actionUrl,
              })
            }
          }
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError)
        }
      }

      // Send real-time update if user has active stream
      this.sendRealTimeUpdate(userId, {
        type: "notification",
        data: notification,
      })
    } catch (error) {
      console.error("Failed to send notification:", error)
    }
  }

  async sendToOrganization(notification: NotificationData) {
    try {
      // This will be handled by the API route which sends to all org users
      await notificationsService.createNotification(notification)
    } catch (error) {
      console.error("Failed to send organization notification:", error)
    }
  }

  private sendRealTimeUpdate(userId: string, data: any) {
    if (typeof window === "undefined") {
      // Server-side: use global streams map
      const streams = (global as any).notificationStreams
      if (streams?.has(userId)) {
        const controller = streams.get(userId)
        const encoder = new TextEncoder()
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          // Stream closed, remove from map
          streams.delete(userId)
        }
      }
    }
  }

  async sendLowStockAlert(itemName: string, currentStock: number, minStock: number) {
    return this.sendToOrganization({
      title: "Low Stock Alert",
      message: `${itemName} is running low (${currentStock}/${minStock} remaining)`,
      type: "WARNING",
      priority: "HIGH",
      data: { itemName, currentStock, minStock },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/inventory`,
    })
  }

  async sendMaintenanceDue(vehicleNumber: string, maintenanceType: string) {
    return this.sendToOrganization({
      title: "Maintenance Due",
      message: `${vehicleNumber} requires ${maintenanceType}`,
      type: "WARNING",
      priority: "NORMAL",
      data: { vehicleNumber, maintenanceType },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/fleet`,
    })
  }

  async sendOrderApproved(orderNumber: string) {
    return this.sendToOrganization({
      title: "Order Approved",
      message: `Order ${orderNumber} has been approved and submitted`,
      type: "SUCCESS",
      priority: "NORMAL",
      data: { orderNumber },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders`,
    })
  }

  async sendEmergencyAlert(message: string) {
    return this.sendToOrganization({
      title: "Emergency Alert",
      message,
      type: "ERROR",
      priority: "URGENT",
      data: { emergency: true },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    })
  }

  async sendMedicationExpiryAlert(medicationName: string, expiryDate: string, vehicleNumber?: string) {
    return this.sendToOrganization({
      title: "Medication Expiry Alert",
      message: `${medicationName} ${vehicleNumber ? `in ${vehicleNumber}` : ""} expires on ${expiryDate}`,
      type: "WARNING",
      priority: "HIGH",
      data: { medicationName, expiryDate, vehicleNumber },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/medications`,
    })
  }

  async sendDailyCheckOverdue(vehicleNumber: string, daysPastDue: number) {
    return this.sendToOrganization({
      title: "Daily Check Overdue",
      message: `${vehicleNumber} daily check is ${daysPastDue} days overdue`,
      type: "ERROR",
      priority: "HIGH",
      data: { vehicleNumber, daysPastDue },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/fleet`,
    })
  }

  async sendOrderDelivered(orderNumber: string, itemCount: number) {
    return this.sendToOrganization({
      title: "Order Delivered",
      message: `Order ${orderNumber} has been delivered (${itemCount} items)`,
      type: "SUCCESS",
      priority: "NORMAL",
      data: { orderNumber, itemCount },
      sendEmail: false, // Less critical, in-app only
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders`,
    })
  }

  async sendSystemMaintenance(startTime: string, duration: string) {
    return this.sendToOrganization({
      title: "Scheduled Maintenance",
      message: `System maintenance scheduled for ${startTime} (${duration})`,
      type: "INFO",
      priority: "NORMAL",
      data: { startTime, duration },
      sendEmail: true,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    })
  }
}

export const notificationService = NotificationService.getInstance()
