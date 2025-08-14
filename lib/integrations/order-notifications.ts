import { notificationService } from "@/lib/notification-service"

export class OrderNotifications {
  static async notifyOrderCreated(order: any, user: any) {
    await notificationService.sendToOrganization({
      title: "New Order Created",
      message: `${user.firstName} ${user.lastName} created order ${order.orderNumber}`,
      type: "INFO",
      priority: "NORMAL",
      data: { orderId: order.id, orderNumber: order.orderNumber, userId: user.id },
    })
  }

  static async notifyOrderApproved(order: any, approver: any) {
    await notificationService.sendOrderApproved(order.orderNumber)
  }

  static async notifyOrderRejected(order: any, rejector: any, reason: string) {
    await notificationService.sendToOrganization({
      title: "Order Rejected",
      message: `Order ${order.orderNumber} was rejected: ${reason}`,
      type: "ERROR",
      priority: "HIGH",
      data: { orderId: order.id, orderNumber: order.orderNumber, reason },
    })
  }

  static async notifyOrderReceived(order: any) {
    await notificationService.sendToOrganization({
      title: "Order Received",
      message: `Order ${order.orderNumber} has been received and is ready for processing`,
      type: "SUCCESS",
      priority: "NORMAL",
      data: { orderId: order.id, orderNumber: order.orderNumber },
    })
  }

  static async notifyUrgentOrderPending(order: any) {
    await notificationService.sendToOrganization({
      title: "Urgent Order Pending",
      message: `Urgent order ${order.orderNumber} requires immediate attention`,
      type: "ERROR",
      priority: "URGENT",
      data: { orderId: order.id, orderNumber: order.orderNumber },
    })
  }
}
