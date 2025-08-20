"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { InventoryTable } from "@/components/inventory-table"
import { InventoryForm } from "@/components/inventory-form"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  expiration_date?: string
  notes?: string
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
  type: string
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
  }

  const handleUseItem = async (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity - quantity

    // Create transaction record
    const { error: transactionError } = await supabase.from("inventory_transactions").insert({
      item_id: itemId,
      transaction_type: "use",
      quantity_change: -quantity,
      quantity_after: newQuantity,
      notes: `Used ${quantity} ${item.unit_of_measure}`,
    })

    if (!transactionError) {
      // Update local state
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
    }
  }

  const handleRestockItem = async (itemId: string, quantity: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newQuantity = item.quantity + quantity

    // Create transaction record
    const { error: transactionError } = await supabase.from("inventory_transactions").insert({
      item_id: itemId,
      transaction_type: "restock",
      quantity_change: quantity,
      quantity_after: newQuantity,
      notes: `Restocked ${quantity} ${item.unit_of_measure}`,
    })

    if (!transactionError) {
      // Update local state
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button variant="ghost" asChild className="mr-4">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-blue-600">Inventory Management</h1>
            </div>
            {isAdmin && (
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  )
}
