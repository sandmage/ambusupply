import { notificationService } from "@/lib/notification-service"

export class FleetNotifications {
  static async notifyMaintenanceDue(vehicle: any, maintenanceType: string, dueDate: Date) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    let priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL"
    if (daysUntilDue <= 0) priority = "URGENT"
    else if (daysUntilDue <= 7) priority = "HIGH"
    else if (daysUntilDue <= 30) priority = "NORMAL"
    else priority = "LOW"

    await notificationService.sendMaintenanceDue(vehicle.unitNumber, maintenanceType)
  }

  static async notifyDailyCheckCompleted(vehicle: any, check: any, user: any) {
    const status = check.status === "COMPLETED" ? "completed" : "failed"

    await notificationService.sendToOrganization({
      title: "Daily Check Completed",
      message: `${user.firstName} ${user.lastName} ${status} daily check for ${vehicle.unitNumber}`,
      type: check.status === "COMPLETED" ? "SUCCESS" : "WARNING",
      priority: check.status === "COMPLETED" ? "LOW" : "NORMAL",
      data: { vehicleId: vehicle.id, checkId: check.id, userId: user.id },
    })
  }

  static async notifyVehicleStatusChange(vehicle: any, oldStatus: string, newStatus: string) {
    let type: "INFO" | "WARNING" | "ERROR" | "SUCCESS" = "INFO"
    let priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL"

    if (newStatus === "OUT_OF_SERVICE" || newStatus === "REPAIR_SHOP") {
      type = "WARNING"
      priority = "HIGH"
    } else if (newStatus === "IN_SERVICE") {
      type = "SUCCESS"
      priority = "NORMAL"
    }

    await notificationService.sendToOrganization({
      title: "Vehicle Status Changed",
      message: `${vehicle.unitNumber} status changed from ${oldStatus} to ${newStatus}`,
      type,
      priority,
      data: { vehicleId: vehicle.id, oldStatus, newStatus },
    })
  }

  static async notifyLowFuel(vehicle: any) {
    await notificationService.sendToOrganization({
      title: "Low Fuel Alert",
      message: `${vehicle.unitNumber} has low fuel (${vehicle.fuelLevel}%)`,
      type: "WARNING",
      priority: "HIGH",
      data: { vehicleId: vehicle.id, fuelLevel: vehicle.fuelLevel },
    })
  }
}
