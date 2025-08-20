"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit, Minus, Plus, AlertTriangle, Clock, MapPin, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

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

interface InventoryTableProps {
  items: InventoryItem[]
  onEditItem: (item: InventoryItem) => void
  onUseItem: (itemId: string, quantity: number) => void
  onRestockItem: (itemId: string, quantity: number) => void
  userRole: string
}

export function InventoryTable({ items, onEditItem, onUseItem, onRestockItem, userRole }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "expiring">("all")
  const [useQuantities, setUseQuantities] = useState<Record<string, number>>({})
  const [restockQuantities, setRestockQuantities] = useState<Record<string, number>>({})

  const isAdmin = userRole === "admin"

  // Filter items based on search and status
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storage_unit_name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (filterStatus === "low") {
      return item.quantity < item.min_par_level
    }
    if (filterStatus === "expiring") {
      if (!item.expiration_date) return false
      const expirationDate = new Date(item.expiration_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return expirationDate <= thirtyDaysFromNow
    }
    return true
  })

  const getStatusBadge = (item: InventoryItem) => {
    const isLow = item.quantity < item.min_par_level
    const isExpiring =
      item.expiration_date && new Date(item.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (isLow && isExpiring) {
      return (
        <Badge variant="destructive" className="text-xs">
          Low & Expiring
        </Badge>
      )
    }
    if (isLow) {
      return (
        <Badge variant="destructive" className="text-xs">
          Below Par
        </Badge>
      )
    }
    if (isExpiring) {
      return (
        <Badge variant="secondary" className="text-xs">
          Expiring Soon
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs">
        Good
      </Badge>
    )
  }

  const getStoragePath = (item: InventoryItem) => {
    if (item.storage_unit_name) {
      return `${item.location_name} > ${item.storage_unit_name}`
    }
    return item.location_name
  }

  const handleUseQuantityChange = (itemId: string, value: string) => {
    const quantity = Number.parseInt(value) || 0
    setUseQuantities((prev) => ({ ...prev, [itemId]: quantity }))
  }

  const handleRestockQuantityChange = (itemId: string, value: string) => {
    const quantity = Number.parseInt(value) || 0
    setRestockQuantities((prev) => ({ ...prev, [itemId]: quantity }))
  }

  const handleUseItem = (item: InventoryItem) => {
    const quantity = useQuantities[item.id] || 1
    if (quantity > 0 && quantity <= item.quantity) {
      onUseItem(item.id, quantity)
      setUseQuantities((prev) => ({ ...prev, [item.id]: 0 }))
    }
  }

  const handleRestockItem = (item: InventoryItem) => {
    const quantity = restockQuantities[item.id] || 1
    if (quantity > 0) {
      onRestockItem(item.id, quantity)
      setRestockQuantities((prev) => ({ ...prev, [item.id]: 0 }))
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No inventory items yet</h3>
          <p className="text-muted-foreground">Add your first inventory item to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search items, descriptions, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({items.length})
              </Button>
              <Button
                variant={filterStatus === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("low")}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Low Stock ({items.filter((item) => item.quantity < item.min_par_level).length})
              </Button>
              <Button
                variant={filterStatus === "expiring" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("expiring")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Expiring (
                {
                  items.filter((item) => {
                    if (!item.expiration_date) return false
                    const expirationDate = new Date(item.expiration_date)
                    const thirtyDaysFromNow = new Date()
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                    return expirationDate <= thirtyDaysFromNow
                  }).length
                }
                )
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Par Level</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                      {item.notes && <div className="text-xs text-muted-foreground mt-1">Note: {item.notes}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {getStoragePath(item)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {item.quantity} {item.unit_of_measure}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {item.min_par_level} {item.unit_of_measure}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.expiration_date ? (
                      <div className="text-sm">{format(new Date(item.expiration_date), "MMM dd, yyyy")}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No expiration</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Use Item */}
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={useQuantities[item.id] || ""}
                          onChange={(e) => handleUseQuantityChange(item.id, e.target.value)}
                          placeholder="1"
                          className="w-16 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseItem(item)}
                          disabled={!useQuantities[item.id] || useQuantities[item.id] > item.quantity}
                          className="h-8 px-2"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Restock Item (Admin only) */}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={restockQuantities[item.id] || ""}
                            onChange={(e) => handleRestockQuantityChange(item.id, e.target.value)}
                            placeholder="1"
                            className="w-16 h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestockItem(item)}
                            disabled={!restockQuantities[item.id]}
                            className="h-8 px-2"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Edit Item (Admin only) */}
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => onEditItem(item)} className="h-8 px-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No items match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
