import { notificationService } from "@/lib/notification-service"

export class SystemNotifications {
  static async notifySystemMaintenance(startTime: Date, endTime: Date, description: string) {
    await notificationService.sendToOrganization({
      title: "Scheduled System Maintenance",
      message: `System maintenance scheduled from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}: ${description}`,
      type: "INFO",
      priority: "NORMAL",
      data: { startTime, endTime, description },
    })
  }

  static async notifySystemAlert(message: string, severity: "LOW" | "NORMAL" | "HIGH" | "URGENT") {
    await notificationService.sendToOrganization({
      title: "System Alert",
      message,
      type: severity === "URGENT" || severity === "HIGH" ? "ERROR" : "WARNING",
      priority: severity,
      data: { systemAlert: true },
    })
  }

  static async notifyUserLogin(user: any, ipAddress?: string) {
    await notificationService.sendToUser(user.id, {
      title: "Login Detected",
      message: `Login detected from ${ipAddress || "unknown location"}`,
      type: "INFO",
      priority: "LOW",
      data: { loginTime: new Date(), ipAddress },
    })
  }

  static async notifyDataBackupCompleted(backupSize: string, duration: number) {
    await notificationService.sendToOrganization({
      title: "Data Backup Completed",
      message: `System backup completed successfully (${backupSize}, ${duration}s)`,
      type: "SUCCESS",
      priority: "LOW",
      data: { backupSize, duration, completedAt: new Date() },
    })
  }
}
