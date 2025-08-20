"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Settings, Package, ArrowRight, Plus } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  quantity: number
  location_name: string
  unit_of_measure: string
}

interface Location {
  id: string
  name: string
}

interface BulkOperationsProps {
  items: InventoryItem[]
  locations: Location[]
  onBulkRestock: (itemIds: string[], quantity: number) => void
  onBulkTransfer: (itemIds: string[], targetLocationId: string) => void
  userRole: string
}

export function BulkOperations({ items, locations, onBulkRestock, onBulkTransfer, userRole }: BulkOperationsProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkQuantity, setBulkQuantity] = useState<number>(1)
  const [targetLocation, setTargetLocation] = useState<string>("")
  const [filterLocation, setFilterLocation] = useState<string>("all")

  const isAdmin = userRole === "admin"

  const filteredItems = items.filter((item) => filterLocation === "all" || item.location_name === filterLocation)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId])
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId))
    }
  }

  const handleBulkRestock = () => {
    if (selectedItems.length > 0 && bulkQuantity > 0) {
      onBulkRestock(selectedItems, bulkQuantity)
      setSelectedItems([])
      setBulkQuantity(1)
    }
  }

  const handleBulkTransfer = () => {
    if (selectedItems.length > 0 && targetLocation) {
      onBulkTransfer(selectedItems, targetLocation)
      setSelectedItems([])
      setTargetLocation("")
    }
  }

  if (!isAdmin) {
    return (
      <Card className="apple-card">
        <CardContent className="p-16 text-center">
          <div className="p-6 rounded-3xl bg-muted/20 inline-flex mb-6">
            <Settings className="h-12 w-12 opacity-50" />
          </div>
          <p className="text-xl font-serif font-bold mb-2">Admin Access Required</p>
          <p className="text-base font-medium text-muted-foreground">Only administrators can perform bulk operations</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="apple-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-serif font-bold text-primary">
            <div className="p-2 rounded-xl bg-primary/10">
              <Settings className="h-6 w-6" />
            </div>
            Bulk Operations
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Perform operations on multiple inventory items at once
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item Selection */}
        <div className="lg:col-span-2">
          <Card className="apple-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-serif font-bold">Select Items</CardTitle>
                <div className="flex items-center gap-4">
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {Array.from(new Set(items.map((item) => item.location_name))).map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">{selectedItems.length} selected</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Checkbox
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select all visible items</span>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.location_name} • {item.quantity} {item.unit_of_measure}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operations */}
        <div className="space-y-6">
          {/* Bulk Restock */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-serif font-bold">
                <Plus className="h-5 w-5 text-green-600" />
                Bulk Restock
              </CardTitle>
              <CardDescription>Add quantity to selected items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity to Add</label>
                <Input
                  type="number"
                  min="1"
                  value={bulkQuantity}
                  onChange={(e) => setBulkQuantity(Number.parseInt(e.target.value) || 1)}
                  className="rounded-xl"
                />
              </div>
              <Button
                onClick={handleBulkRestock}
                disabled={selectedItems.length === 0 || bulkQuantity <= 0}
                className="w-full apple-button-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Restock {selectedItems.length} Items
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Transfer */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-serif font-bold">
                <ArrowRight className="h-5 w-5 text-primary" />
                Bulk Transfer
              </CardTitle>
              <CardDescription>Move selected items to another location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Location</label>
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleBulkTransfer}
                disabled={selectedItems.length === 0 || !targetLocation}
                className="w-full apple-button-primary"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Transfer {selectedItems.length} Items
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
