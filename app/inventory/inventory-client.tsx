"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { InventoryTable } from "@/components/inventory-table"
import { InventoryForm } from "@/components/inventory-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, AlertTriangle, Clock, TrendingDown } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  expiration_date?: string
  lot_number?: string
  location_name: string
  storage_unit_name?: string
  created_at: string
}

interface Location {
  id: string
  name: string
  storage_units: StorageUnit[]
}

interface StorageUnit {
  id: string
  name: string
  unit_type: string
}

interface InventoryClientProps {
  items: InventoryItem[]
  locations: Location[]
  userRole: string
}

export function InventoryClient({ items: initialItems, locations, userRole }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()
  const router = useRouter()

  const supabase = createClient()
  const isAdmin = userRole === "admin"

  // Calculate statistics
  const totalItems = items.length
  const belowParCount = items.filter((item) => item.quantity < item.min_par_level && item.min_par_level > 0).length
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringCount = items.filter(
    (item) => item.expiration_date && new Date(item.expiration_date) <= thirtyDaysFromNow,
  ).length
  const outOfStockCount = items.filter((item) => item.quantity === 0).length

  const handleAddItem = () => {
    setEditingItem(undefined)
    setIsFormOpen(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    // Find the location and storage unit IDs for the form
    const location = locations.find((loc) => loc.name === item.location_name)
    const storageUnit = location?.storage_units.find((unit) => unit.name === item.storage_unit_name)

    setEditingItem({
      ...item,
      location_id: location?.id || "",
      storage_unit_id: storageUnit?.id || "",
    } as any)
    setIsFormOpen(true)
  }

  const handleSaveItem = async (itemData: any) => {
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase.from("inventory_items").update(itemData).eq("id", editingItem.id)
        if (!error) {
          router.refresh()
        }
      } else {
        // Create new item
        const { error } = await supabase.from("inventory_items").insert(itemData)
        if (!error) {
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error saving item:", error)
    }
  }

  const handleUseItem = async (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newQuantity = Math.max(0, item.quantity - quantity)

    try {
      // Update inventory quantity
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ current_quantity: newQuantity })
        .eq("id", itemId)

      if (!updateError) {
        // Create transaction record
        await supabase.from("transactions").insert({
          item_id: itemId,
          transaction_type: "use",
          quantity_change: -quantity,
          reason: `Used ${quantity} ${item.unit_of_measure}`,
          performed_by: userRole,
        })

        // Update local state
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
      }
    } catch (error) {
      console.error("Error using item:", error)
    }
  }

  const handleRestockItem = async (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity + quantity

    try {
      // Update inventory quantity
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ current_quantity: newQuantity })
        .eq("id", itemId)

      if (!updateError) {
        // Create transaction record
        await supabase.from("transactions").insert({
          item_id: itemId,
          transaction_type: "restock",
          quantity_change: quantity,
          reason: `Restocked ${quantity} ${item.unit_of_measure}`,
          performed_by: userRole,
        })

        // Update local state
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
      }
    } catch (error) {
      console.error("Error restocking item:", error)
    }
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground medical-heading">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Manage medical supplies and track usage" : "View inventory and record usage"}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={handleAddItem} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">{totalItems}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Items</div>
                </div>
                <Package className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-destructive">{belowParCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Below Par Level</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-500">{expiringCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Expiring Soon</div>
                </div>
                <Clock className="h-8 w-8 text-orange-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-destructive">{outOfStockCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Out of Stock</div>
                </div>
                <TrendingDown className="h-8 w-8 text-destructive/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {(belowParCount > 0 || expiringCount > 0 || outOfStockCount > 0) && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Inventory Alerts
              </CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {belowParCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {belowParCount} items below par level
                  </Badge>
                )}
                {expiringCount > 0 && (
                  <Badge className="text-sm bg-orange-500 text-white">{expiringCount} items expiring soon</Badge>
                )}
                {outOfStockCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {outOfStockCount} items out of stock
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <InventoryTable
          items={items}
          onEditItem={handleEditItem}
          onUseItem={handleUseItem}
          onRestockItem={handleRestockItem}
          userRole={userRole}
        />

        {isAdmin && (
          <InventoryForm
            item={editingItem}
            locations={locations}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveItem}
          />
        )}
      </div>
    </div>
  )
}
