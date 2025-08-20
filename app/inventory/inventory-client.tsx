"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { InventoryTable } from "@/components/inventory-table"
import { InventoryForm } from "@/components/inventory-form"
import { TransactionHistory } from "@/components/transaction-history"
import { InventoryReports } from "@/components/inventory-reports"
import { BulkOperations } from "@/components/bulk-operations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  History,
  BarChart3,
  Settings,
  Download,
  Layers,
} from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number // This maps to current_quantity in database
  min_par_level: number // This maps to par_level in database
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
  const [activeTab, setActiveTab] = useState("inventory")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
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
          .from("inventory_items")
          .update({
            name: itemData.name,
            description: itemData.description || null,
            current_quantity: itemData.quantity, // Map quantity to current_quantity
            par_level: itemData.min_par_level, // Map min_par_level to par_level
            unit_of_measure: itemData.unit_of_measure,
            expiration_date: itemData.expiration_date || null,
            location_id: itemData.location_id,
            storage_unit_id: itemData.storage_unit_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id)

        if (error) {
          console.error("[v0] Error updating inventory item:", error)
          throw error
        }

        console.log("[v0] Inventory item updated successfully")
      } else {
        // Create new item
        console.log("[v0] Creating new inventory item")

        const { data, error } = await supabase.from("inventory_items").insert({
          name: itemData.name,
          description: itemData.description || null,
          current_quantity: itemData.quantity, // Map quantity to current_quantity
          par_level: itemData.min_par_level, // Map min_par_level to par_level
          unit_of_measure: itemData.unit_of_measure,
          expiration_date: itemData.expiration_date || null,
          location_id: itemData.location_id,
          storage_unit_id: itemData.storage_unit_id || null,
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

  const handleBulkRestock = async (itemIds: string[], quantity: number) => {
    try {
      for (const itemId of itemIds) {
        await handleRestockItem(itemId, quantity)
      }
      setSelectedItems([])
    } catch (error) {
      console.error("Error with bulk restock:", error)
    }
  }

  const handleBulkTransfer = async (itemIds: string[], targetLocationId: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ location_id: targetLocationId })
        .in("id", itemIds)

      if (!error) {
        router.refresh()
        setSelectedItems([])
      }
    } catch (error) {
      console.error("Error with bulk transfer:", error)
    }
  }

  const handleExportInventory = () => {
    const csvContent = [
      ["Name", "Description", "Quantity", "Par Level", "Unit", "Location", "Storage Unit", "Expiration", "Lot Number"],
      ...items.map((item) => [
        item.name,
        item.description || "",
        item.quantity.toString(),
        item.min_par_level.toString(),
        item.unit_of_measure,
        item.location_name,
        item.storage_unit_name || "",
        item.expiration_date || "",
        item.lot_number || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/inventory/hierarchical")}
              className="apple-button-outline"
            >
              <Layers className="h-5 w-5 mr-2" />
              Hierarchical View
            </Button>

            <Button variant="outline" onClick={handleExportInventory} className="apple-button-outline bg-transparent">
              <Download className="h-5 w-5 mr-2" />
              Export
            </Button>

            {isAdmin && (
              <Button onClick={handleAddItem} className="apple-button-secondary">
                <Plus className="h-5 w-5 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Bulk Ops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-8">
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
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
          />
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory />
        </TabsContent>

        <TabsContent value="reports">
          <InventoryReports items={items} />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkOperations
            items={items}
            locations={locations}
            onBulkRestock={handleBulkRestock}
            onBulkTransfer={handleBulkTransfer}
            userRole={userRole}
          />
        </TabsContent>
      </Tabs>

      {/* Existing form */}
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
  )
}
