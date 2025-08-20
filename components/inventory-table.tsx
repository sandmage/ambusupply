"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit, Minus, Plus, MapPin, Package, Search, Filter, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface InventoryTableProps {
  items: InventoryItem[]
  onEditItem: (item: InventoryItem) => void
  onUseItem: (itemId: string, quantity: number) => void
  onRestockItem: (itemId: string, quantity: number) => void
  userRole: string
}

type SortField = "name" | "quantity" | "min_par_level" | "expiration_date" | "location_name"
type SortDirection = "asc" | "desc"

export function InventoryTable({ items, onEditItem, onUseItem, onRestockItem, userRole }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "expiring" | "out_of_stock">("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [useQuantities, setUseQuantities] = useState<Record<string, number>>({})
  const [restockQuantities, setRestockQuantities] = useState<Record<string, number>>({})

  const isAdmin = userRole === "admin"

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.storage_unit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lot_number?.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      switch (filterStatus) {
        case "low":
          return item.quantity < item.min_par_level && item.min_par_level > 0
        case "expiring":
          if (!item.expiration_date) return false
          const expirationDate = new Date(item.expiration_date)
          const thirtyDaysFromNow = new Date()
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
          return expirationDate <= thirtyDaysFromNow
        case "out_of_stock":
          return item.quantity === 0
        default:
          return true
      }
    })
    .sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "expiration_date") {
        aValue = a.expiration_date ? new Date(a.expiration_date) : new Date("9999-12-31")
        bValue = b.expiration_date ? new Date(b.expiration_date) : new Date("9999-12-31")
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  const getStatusBadge = (item: InventoryItem) => {
    const isOutOfStock = item.quantity === 0
    const isLow = item.quantity < item.min_par_level && item.min_par_level > 0
    const isExpiring =
      item.expiration_date && new Date(item.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (isOutOfStock) {
      return (
        <Badge variant="destructive" className="status-indicator status-low">
          Out of Stock
        </Badge>
      )
    }
    if (isLow && isExpiring) {
      return (
        <Badge variant="destructive" className="status-indicator status-low">
          Low & Expiring
        </Badge>
      )
    }
    if (isLow) {
      return (
        <Badge variant="destructive" className="status-indicator status-low">
          Below Par
        </Badge>
      )
    }
    if (isExpiring) {
      return <Badge className="status-indicator bg-orange-500 text-white">Expiring Soon</Badge>
    }
    return (
      <Badge variant="outline" className="status-indicator status-normal">
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
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No inventory items yet</h3>
          <p className="text-muted-foreground mb-4">Start building your medical supply inventory</p>
          {isAdmin && (
            <Button onClick={() => onEditItem({} as InventoryItem)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="medical-heading">Inventory Items</CardTitle>
            <CardDescription>
              Manage medical supplies and track stock levels • {filteredAndSortedItems.length} of {items.length} items
              shown
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredAndSortedItems.length} items
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, descriptions, locations, or lot numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items ({items.length})</SelectItem>
                <SelectItem value="low">
                  Below Par (
                  {items.filter((item) => item.quantity < item.min_par_level && item.min_par_level > 0).length})
                </SelectItem>
                <SelectItem value="expiring">
                  Expiring Soon (
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
                </SelectItem>
                <SelectItem value="out_of_stock">
                  Out of Stock ({items.filter((item) => item.quantity === 0).length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">
                  <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                    Item Details {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("location_name")}
                    className="h-auto p-0 font-semibold"
                  >
                    Location {getSortIcon("location_name")}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button variant="ghost" onClick={() => handleSort("quantity")} className="h-auto p-0 font-semibold">
                    Current Stock {getSortIcon("quantity")}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("min_par_level")}
                    className="h-auto p-0 font-semibold"
                  >
                    Par Level {getSortIcon("min_par_level")}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("expiration_date")}
                    className="h-auto p-0 font-semibold"
                  >
                    Expiration {getSortIcon("expiration_date")}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{item.name}</div>
                      {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                      {item.lot_number && <div className="text-xs text-muted-foreground">Lot: {item.lot_number}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">{getStoragePath(item)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {item.quantity} {item.unit_of_measure}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">
                      {item.min_par_level} {item.unit_of_measure}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.expiration_date ? (
                      <div className="text-sm text-foreground">
                        {format(new Date(item.expiration_date), "MMM dd, yyyy")}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No expiration</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {/* Use Item */}
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={useQuantities[item.id] || ""}
                          onChange={(e) =>
                            setUseQuantities((prev) => ({ ...prev, [item.id]: Number.parseInt(e.target.value) || 0 }))
                          }
                          placeholder="1"
                          className="w-16 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const quantity = useQuantities[item.id] || 1
                            onUseItem(item.id, quantity)
                            setUseQuantities((prev) => ({ ...prev, [item.id]: 0 }))
                          }}
                          disabled={
                            !useQuantities[item.id] || useQuantities[item.id] > item.quantity || item.quantity === 0
                          }
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
                            onChange={(e) =>
                              setRestockQuantities((prev) => ({
                                ...prev,
                                [item.id]: Number.parseInt(e.target.value) || 0,
                              }))
                            }
                            placeholder="1"
                            className="w-16 h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const quantity = restockQuantities[item.id] || 1
                              onRestockItem(item.id, quantity)
                              setRestockQuantities((prev) => ({ ...prev, [item.id]: 0 }))
                            }}
                            disabled={!restockQuantities[item.id]}
                            className="h-8 px-2 text-secondary hover:text-secondary"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Edit Item (Admin only) */}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditItem(item)}
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedItems.length === 0 && searchTerm && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No items found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
