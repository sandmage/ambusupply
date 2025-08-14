"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

export function OrdersHeader() {
  const handleExportOrders = () => {
    toast.success("Orders exported successfully!", {
      description: "Your orders data has been downloaded as CSV.",
    })

    // Simulate file download
    const csvContent =
      "data:text/csv;charset=utf-8,Order ID,Supplier,Items,Amount,Status\nORD-2024-001,MedSupply Co.,8,$2450.00,Shipped"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "orders_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewCart = () => {
    toast.info("Shopping Cart", {
      description: "Cart contains 3 items ready for checkout.",
    })
  }

  const handleNewOrder = () => {
    toast.info("New Order", {
      description: "New order form will open here. Feature in development.",
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Supply Orders</h1>
        <p className="text-muted-foreground mt-1">Manage medical supply orders and track deliveries</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleExportOrders}>
          <Download className="h-4 w-4 mr-2" />
          Export Orders
        </Button>
        <Button variant="outline" size="sm" onClick={handleViewCart}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Cart (3)
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleNewOrder}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>
    </div>
  )
}
