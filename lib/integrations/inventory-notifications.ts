import { notificationService } from "@/lib/notification-service"

export class InventoryNotifications {
  static async checkLowStock(item: any) {
    if (item.currentStock <= item.minStock) {
      await notificationService.sendLowStockAlert(item.name, item.currentStock, item.minStock)
    }
  }

  static async notifyStockUpdate(item: any, oldStock: number, newStock: number, reason: string) {
    const change = newStock - oldStock
    const changeType = change > 0 ? "increased" : "decreased"

    await notificationService.sendToOrganization({
      title: "Stock Updated",
      message: `${item.name} stock ${changeType} by ${Math.abs(change)} units (${reason})`,
      type: "INFO",
      priority: "LOW",
      data: { itemId: item.id, oldStock, newStock, reason },
    })

    // Check if this update caused low stock
    if (newStock <= item.minStock && oldStock > item.minStock) {
      await this.checkLowStock(item)
    }
  }

  static async notifyExpiringItems(items: any[]) {
    for (const item of items) {
      await notificationService.sendToOrganization({
        title: "Item Expiring Soon",
        message: `${item.name} expires on ${new Date(item.expiryDate).toLocaleDateString()}`,
        type: "WARNING",
        priority: "NORMAL",
        data: { itemId: item.id, expiryDate: item.expiryDate },
      })
    }
  }
}
