import { notificationService } from "@/lib/notification-service"

export class MedicationNotifications {
  static async notifyExpiringMedications(medications: any[]) {
    for (const med of medications) {
      const daysUntilExpiry = Math.ceil((new Date(med.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      let priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL"
      if (daysUntilExpiry <= 0) priority = "URGENT"
      else if (daysUntilExpiry <= 30) priority = "HIGH"
      else if (daysUntilExpiry <= 90) priority = "NORMAL"

      await notificationService.sendToOrganization({
        title: "Medication Expiring",
        message: `${med.name} (${med.dosage}) expires in ${daysUntilExpiry} days`,
        type: daysUntilExpiry <= 0 ? "ERROR" : "WARNING",
        priority,
        data: { medicationId: med.id, expiryDate: med.expiryDate, location: med.location },
      })
    }
  }

  static async notifyLowMedicationStock(medication: any) {
    await notificationService.sendToOrganization({
      title: "Low Medication Stock",
      message: `${medication.name} (${medication.dosage}) is running low (${medication.quantity} remaining)`,
      type: "WARNING",
      priority: "HIGH",
      data: { medicationId: medication.id, quantity: medication.quantity },
    })
  }

  static async notifyControlledSubstanceAccess(medication: any, user: any, action: string) {
    await notificationService.sendToOrganization({
      title: "Controlled Substance Access",
      message: `${user.firstName} ${user.lastName} ${action} controlled substance: ${medication.name}`,
      type: "INFO",
      priority: "HIGH",
      data: {
        medicationId: medication.id,
        userId: user.id,
        action,
        controlledClass: medication.controlledClass,
      },
    })
  }
}
