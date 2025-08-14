import { db } from "@/lib/db"

export interface ActivityItem {
  id: string
  type: "deployment" | "supply" | "alert" | "maintenance" | "order" | "check" | "medication"
  message: string
  shortMessage: string
  time: string
  status: "active" | "completed" | "warning" | "error"
  icon: string
  userId?: string
  vehicleId?: string
  itemId?: string
  metadata?: Record<string, any>
}

export class ActivityService {
  static async getRecentActivities(limit = 10): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = []

    try {
      // Get recent notifications
      const notifications = await db.notification.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      })

      notifications.forEach((notification) => {
        activities.push({
          id: `notification-${notification.id}`,
          type: this.getActivityTypeFromNotification(notification.type),
          message: notification.message,
          shortMessage: this.truncateMessage(notification.message),
          time: this.formatTimeAgo(notification.createdAt),
          status: this.getStatusFromNotificationType(notification.type),
          icon: this.getIconFromNotificationType(notification.type),
          metadata: { notificationId: notification.id, priority: notification.priority },
        })
      })

      // Get recent stock movements
      const stockMovements = await db.stockMovement.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { item: true },
      })

      stockMovements.forEach((movement) => {
        activities.push({
          id: `stock-${movement.id}`,
          type: "supply",
          message: `${movement.item.name} - ${movement.type.toLowerCase()} (${Math.abs(movement.quantity)} units)`,
          shortMessage: `${movement.item.name} ${movement.type.toLowerCase()}`,
          time: this.formatTimeAgo(movement.createdAt),
          status: movement.type === "OUT" ? "warning" : "completed",
          icon: "Package",
          itemId: movement.itemId,
          metadata: { movementType: movement.type, quantity: movement.quantity },
        })
      })

      // Get recent orders
      const orders = await db.order.findMany({
        take: 3,
        orderBy: { updatedAt: "desc" },
        include: { supplier: true, user: true },
      })

      orders.forEach((order) => {
        activities.push({
          id: `order-${order.id}`,
          type: "order",
          message: `Order ${order.orderNumber} ${order.status.toLowerCase()} - ${order.supplier.name}`,
          shortMessage: `Order ${order.orderNumber} ${order.status.toLowerCase()}`,
          time: this.formatTimeAgo(order.updatedAt),
          status: this.getStatusFromOrderStatus(order.status),
          icon: "ShoppingCart",
          userId: order.userId,
          metadata: { orderNumber: order.orderNumber, status: order.status, total: order.totalAmount },
        })
      })

      // Get recent daily checks
      const dailyChecks = await db.dailyCheck.findMany({
        take: 3,
        orderBy: { updatedAt: "desc" },
        include: { vehicle: true, user: true },
      })

      dailyChecks.forEach((check) => {
        activities.push({
          id: `check-${check.id}`,
          type: "check",
          message: `Daily check ${check.status.toLowerCase()} for Unit ${check.vehicle.unitNumber}`,
          shortMessage: `Unit ${check.vehicle.unitNumber} check ${check.status.toLowerCase()}`,
          time: this.formatTimeAgo(check.updatedAt),
          status: check.status === "COMPLETED" ? "completed" : check.status === "FAILED" ? "error" : "active",
          icon: "CheckCircle",
          vehicleId: check.vehicleId,
          userId: check.userId,
          metadata: { checkStatus: check.status, shift: check.shift },
        })
      })

      // Get recent maintenance records
      const maintenanceRecords = await db.maintenanceRecord.findMany({
        take: 2,
        orderBy: { createdAt: "desc" },
        include: { vehicle: true },
      })

      maintenanceRecords.forEach((record) => {
        activities.push({
          id: `maintenance-${record.id}`,
          type: "maintenance",
          message: `${record.type.replace("_", " ").toLowerCase()} completed for Unit ${record.vehicle.unitNumber}`,
          shortMessage: `Unit ${record.vehicle.unitNumber} maintenance`,
          time: this.formatTimeAgo(record.createdAt),
          status: "completed",
          icon: "Wrench",
          vehicleId: record.vehicleId,
          metadata: { maintenanceType: record.type, cost: record.cost },
        })
      })
    } catch (error) {
      console.error("Error fetching activities:", error)
      // Return fallback static data if database fails
      return this.getFallbackActivities()
    }

    // Sort by time and limit results
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, limit)
  }

  private static getActivityTypeFromNotification(type: string): ActivityItem["type"] {
    switch (type) {
      case "ERROR":
      case "WARNING":
        return "alert"
      default:
        return "alert"
    }
  }

  private static getStatusFromNotificationType(type: string): ActivityItem["status"] {
    switch (type) {
      case "SUCCESS":
        return "completed"
      case "ERROR":
        return "error"
      case "WARNING":
        return "warning"
      default:
        return "active"
    }
  }

  private static getStatusFromOrderStatus(status: string): ActivityItem["status"] {
    switch (status) {
      case "RECEIVED":
      case "DELIVERED":
        return "completed"
      case "CANCELLED":
        return "error"
      case "PENDING":
      case "APPROVED":
        return "warning"
      default:
        return "active"
    }
  }

  private static getIconFromNotificationType(type: string): string {
    switch (type) {
      case "SUCCESS":
        return "CheckCircle"
      case "ERROR":
        return "AlertCircle"
      case "WARNING":
        return "AlertTriangle"
      default:
        return "Info"
    }
  }

  private static truncateMessage(message: string, maxLength = 40): string {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message
  }

  private static formatTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  private static getFallbackActivities(): ActivityItem[] {
    return [
      {
        id: "fallback-1",
        type: "deployment",
        message: "Ambulance Unit 12 deployed to Emergency Call #4521",
        shortMessage: "Unit 12 deployed",
        time: "2m ago",
        status: "active",
        icon: "Truck",
      },
      {
        id: "fallback-2",
        type: "supply",
        message: "Medical supplies restocked - Bandages (500 units)",
        shortMessage: "Bandages restocked",
        time: "15m ago",
        status: "completed",
        icon: "Package",
      },
    ]
  }
}
