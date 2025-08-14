"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, ShoppingCart, Zap, Package } from "lucide-react"
import { useState } from "react"

export function QuickOrder() {
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [quantity, setQuantity] = useState("")
  const [priority, setPriority] = useState("")
  const [cartItems, setCartItems] = useState<any[]>([])

  const frequentItems = [
    { id: "1", name: "Oxygen Tank (15L)", price: 125.0, inStock: true },
    { id: "2", name: "Sterile Bandages", price: 15.99, inStock: true },
    { id: "3", name: "Disposable Syringes", price: 22.99, inStock: false },
    { id: "4", name: "Morphine 10mg/ml", price: 45.5, inStock: true },
  ]

  const recentSuppliers = ["MedSupply Co.", "HealthCare Plus", "CardioTech", "PharmaCorp"]

  const handleAddToCart = () => {
    if (!selectedSupplier || !searchTerm || !quantity || !priority) {
      alert("Please fill in all fields")
      return
    }

    const newItem = {
      id: Date.now().toString(),
      supplier: selectedSupplier,
      item: searchTerm,
      quantity: Number.parseInt(quantity),
      priority,
    }

    setCartItems([...cartItems, newItem])

    // Reset form
    setSearchTerm("")
    setQuantity("")
    setPriority("")

    console.log("Added to cart:", newItem)
  }

  const handleQuickAdd = (item: any) => {
    if (!item.inStock) return

    const newItem = {
      id: Date.now().toString(),
      supplier: "MedSupply Co.", // Default supplier
      item: item.name,
      quantity: 1,
      priority: "normal",
    }

    setCartItems([...cartItems, newItem])
    console.log("Quick added to cart:", newItem)
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return

    console.log("Proceeding to checkout with items:", cartItems)
    // TODO: Navigate to checkout page or open checkout modal
  }

  return (
    <div className="space-y-6">
      {/* Quick Order Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Supplier</label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {recentSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier.toLowerCase().replace(/\s+/g, "-")}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Item Search</label>
            <Input
              placeholder="Search medical supplies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Quantity</label>
            <Input
              type="number"
              placeholder="Enter quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleAddToCart}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>

      {/* Frequent Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Frequent Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {frequentItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">${item.price.toFixed(2)}</div>
                  <div className="mt-1">
                    {item.inStock ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">In Stock</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 text-xs">Out of Stock</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!item.inStock}
                  className="ml-2 bg-transparent"
                  onClick={() => handleQuickAdd(item)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Cart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Current Cart ({cartItems.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">Cart is empty</div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium text-sm">{item.item}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {item.quantity} | {item.priority}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCartItems(cartItems.filter((i) => i.id !== item.id))}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
            <Button
              variant="outline"
              className="w-full bg-transparent"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
