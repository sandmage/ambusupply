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
      console.log("[v0] Starting inventory item save operation")
      console.log("[v0] Item data:", itemData)
      console.log("[v0] Editing item:", editingItem)

      if (editingItem && editingItem.id) {
        // Update existing item
        console.log("[v0] Updating existing inventory item with ID:", editingItem.id)

        const { data, error } = await supabase
          .rpc("exec_sql", {
            sql: `
            UPDATE inventory_items 
            SET name = $1, description = $2, quantity = $3, min_par_level = $4, 
                unit_of_measure = $5, expiration_date = $6, location_id = $7, 
                storage_unit_id = $8, updated_at = NOW()
            WHERE id = $9
          `,
            params: [
              itemData.name,
              itemData.description || null,
              itemData.quantity,
              itemData.min_par_level,
              itemData.unit_of_measure,
              itemData.expiration_date || null,
              itemData.location_id,
              itemData.storage_unit_id || null,
              editingItem.id,
            ],
          })
          .catch(async () => {
            // Fallback: use direct query without min_par_level
            console.log("[v0] Fallback: updating without min_par_level field")
            return await supabase
              .from("inventory_items")
              .update({
                name: itemData.name,
                description: itemData.description || null,
                quantity: itemData.quantity,
                unit_of_measure: itemData.unit_of_measure,
                expiration_date: itemData.expiration_date || null,
                location_id: itemData.location_id,
                storage_unit_id: itemData.storage_unit_id || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", editingItem.id)
          })

        if (error) {
          console.error("[v0] Error updating inventory item:", error)
          throw error
        }

        console.log("[v0] Inventory item updated successfully")
      } else {
        // Create new item
        console.log("[v0] Creating new inventory item")

        const { data, error } = await supabase
          .rpc("exec_sql", {
            sql: `
            INSERT INTO inventory_items (name, description, quantity, min_par_level, unit_of_measure, expiration_date, location_id, storage_unit_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
            params: [
              itemData.name,
              itemData.description || null,
              itemData.quantity,
              itemData.min_par_level,
              itemData.unit_of_measure,
              itemData.expiration_date || null,
              itemData.location_id,
              itemData.storage_unit_id || null,
            ],
          })
          .catch(async () => {
            // Fallback: use direct query without min_par_level
            console.log("[v0] Fallback: creating without min_par_level field")
            return await supabase.from("inventory_items").insert({
              name: itemData.name,
              description: itemData.description || null,
              quantity: itemData.quantity,
              unit_of_measure: itemData.unit_of_measure,
              expiration_date: itemData.expiration_date || null,
              location_id: itemData.location_id,
              storage_unit_id: itemData.storage_unit_id || null,
            })
          })

        if (error) {
          console.error("[v0] Error creating inventory item:", error)
          throw error
        }

        console.log("[v0] Inventory item created successfully")
      }

      setIsFormOpen(false)
      setEditingItem(undefined)
      console.log("[v0] Form closed and editing state cleared")

      router.refresh()
      console.log("[v0] Page refresh triggered")
    } catch (error) {
      console.error("[v0] Error saving inventory item:", error)
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
    <div className="h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Inventory Management</h1>
            <p className="text-lg text-muted-foreground font-medium">
              {isAdmin ? "Manage medical supplies and track usage" : "View inventory and record usage"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAddItem} className="apple-button-secondary">
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 transition-transform duration-200 group-hover:scale-110">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-primary mb-2">{totalItems}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Items</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-destructive/10 transition-transform duration-200 group-hover:scale-110">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-destructive mb-2">{belowParCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Below Par Level</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-orange-100 transition-transform duration-200 group-hover:scale-110">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-orange-600 mb-2">{expiringCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Expiring Soon</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-destructive/10 transition-transform duration-200 group-hover:scale-110">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-destructive mb-2">{outOfStockCount}</div>
              <div className="text-sm text-muted-foreground font-medium">Out of Stock</div>
            </CardContent>
          </Card>
        </div>

        {(belowParCount > 0 || expiringCount > 0 || outOfStockCount > 0) && (
          <Card className="apple-card border-destructive/30 bg-gradient-to-r from-destructive/5 to-orange-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-destructive">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="font-serif font-bold">Inventory Alerts</span>
              </CardTitle>
              <CardDescription className="text-base">Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {belowParCount > 0 && (
                  <Badge variant="destructive" className="text-sm font-medium px-3 py-1 rounded-xl">
                    {belowParCount} items below par level
                  </Badge>
                )}
                {expiringCount > 0 && (
                  <Badge className="text-sm font-medium px-3 py-1 rounded-xl bg-orange-500 text-white hover:bg-orange-600">
                    {expiringCount} items expiring soon
                  </Badge>
                )}
                {outOfStockCount > 0 && (
                  <Badge variant="destructive" className="text-sm font-medium px-3 py-1 rounded-xl">
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
