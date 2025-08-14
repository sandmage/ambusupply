"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Edit, Truck, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function OrdersTable() {
  const orders = [
    {
      id: "ORD-2024-001",
      supplier: "MedSupply Co.",
      items: 8,
      totalAmount: 2450.0,
      status: "shipped",
      priority: "normal",
      orderDate: "2024-01-15",
      expectedDelivery: "2024-01-18",
      trackingNumber: "MS123456789",
    },
    {
      id: "ORD-2024-002",
      supplier: "HealthCare Plus",
      items: 3,
      totalAmount: 890.5,
      status: "pending",
      priority: "urgent",
      orderDate: "2024-01-16",
      expectedDelivery: "2024-01-17",
      trackingNumber: null,
    },
    {
      id: "ORD-2024-003",
      supplier: "CardioTech",
      items: 2,
      totalAmount: 3200.0,
      status: "approved",
      priority: "normal",
      orderDate: "2024-01-14",
      expectedDelivery: "2024-01-20",
      trackingNumber: null,
    },
    {
      id: "ORD-2024-004",
      supplier: "PharmaCorp",
      items: 12,
      totalAmount: 1650.75,
      status: "delivered",
      priority: "normal",
      orderDate: "2024-01-10",
      expectedDelivery: "2024-01-15",
      trackingNumber: "PC987654321",
    },
    {
      id: "ORD-2024-005",
      supplier: "MedSupply Co.",
      items: 5,
      totalAmount: 750.0,
      status: "cancelled",
      priority: "low",
      orderDate: "2024-01-12",
      expectedDelivery: null,
      trackingNumber: null,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="destructive" className="text-xs">
            Urgent
          </Badge>
        )
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 text-xs">High</Badge>
      case "normal":
        return (
          <Badge variant="outline" className="text-xs">
            Normal
          </Badge>
        )
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "shipped":
        return <Truck className="h-4 w-4 text-purple-600" />
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const handleView = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    toast.info(`Viewing ${order?.id}`, {
      description: `${order?.items} items from ${order?.supplier} | Total: $${order?.totalAmount.toFixed(2)} | Status: ${order?.status}`,
    })
  }

  const handleEdit = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    toast.info(`Edit ${order?.id}`, {
      description: "Order edit form will open here. Feature in development.",
    })
  }

  const handleTrack = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (order?.trackingNumber) {
      toast.success(`Tracking ${order.id}`, {
        description: `Tracking Number: ${order.trackingNumber} | Expected: ${order.expectedDelivery}`,
      })
    } else {
      toast.info("No Tracking Available", {
        description: "Tracking information not yet available for this order.",
      })
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Details</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{order.id}</div>
                    <div className="text-sm text-muted-foreground">Ordered: {order.orderDate}</div>
                    {order.trackingNumber && (
                      <div className="text-xs text-muted-foreground">Tracking: {order.trackingNumber}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.supplier}</div>
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    <span className="font-medium">{order.items}</span>
                    <div className="text-xs text-muted-foreground">items</div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    {getStatusBadge(order.status)}
                  </div>
                </TableCell>
                <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                <TableCell className="text-sm">{order.expectedDelivery || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(order.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(order.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTrack(order.id)}>
                      <Truck className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
