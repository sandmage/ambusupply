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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
      <Card className="apple-card">
        <CardContent className="p-16 text-center">
          <div className="p-6 rounded-3xl bg-primary/10 inline-flex mb-6">
            <Package className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-2xl font-serif font-bold mb-3 text-primary">No inventory items yet</h3>
          <p className="text-lg text-muted-foreground mb-6 font-medium">Start building your medical supply inventory</p>
          {isAdmin && (
            <Button onClick={() => onEditItem({} as InventoryItem)} className="apple-button-secondary">
              <Plus className="h-5 w-5 mr-2" />
              Add First Item
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className="apple-card">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif font-bold text-primary">Inventory Items</CardTitle>
              <CardDescription className="text-base font-medium mt-2">
                Manage medical supplies and track stock levels • {filteredAndSortedItems.length} of {items.length} items
                shown
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm font-medium px-3 py-1 rounded-xl">
              {filteredAndSortedItems.length} items
            </Badge>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search items, descriptions, locations, or lot numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-border/50 bg-card text-base"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-56 h-12 rounded-2xl border-border/50 bg-card">
                  <Filter className="h-5 w-5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50">
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
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-base h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="h-auto p-0 font-semibold text-base rounded-xl"
                    >
                      Item Details {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold text-base h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("location_name")}
                      className="h-auto p-0 font-semibold text-base rounded-xl"
                    >
                      Location {getSortIcon("location_name")}
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold text-base h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("quantity")}
                      className="h-auto p-0 font-semibold text-base rounded-xl"
                    >
                      Current Stock {getSortIcon("quantity")}
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold text-base h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("min_par_level")}
                      className="h-auto p-0 font-semibold text-base rounded-xl"
                    >
                      Par Level {getSortIcon("min_par_level")}
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold text-base h-14">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("expiration_date")}
                      className="h-auto p-0 font-semibold text-base rounded-xl"
                    >
                      Expiration {getSortIcon("expiration_date")}
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold text-base h-14">Status</TableHead>
                  <TableHead className="font-semibold text-base text-right h-14">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-all duration-200 h-16">
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground text-base">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground font-medium">{item.description}</div>
                        )}
                        {item.lot_number && (
                          <div className="text-xs text-muted-foreground font-medium">Lot: {item.lot_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 rounded-lg bg-primary/10">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground font-medium">{getStoragePath(item)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-foreground text-base">
                        {item.quantity} {item.unit_of_measure}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-foreground font-medium">
                        {item.min_par_level} {item.unit_of_measure}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {item.expiration_date ? (
                        <div className="text-sm text-foreground font-medium">
                          {format(new Date(item.expiration_date), "MMM dd, yyyy")}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground font-medium">No expiration</div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(item)}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={useQuantities[item.id] || ""}
                            onChange={(e) =>
                              setUseQuantities((prev) => ({ ...prev, [item.id]: Number.parseInt(e.target.value) || 0 }))
                            }
                            placeholder="1"
                            className="w-16 h-9 text-sm rounded-xl border-border/50"
                            aria-label="Quantity to use/consume"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const quantity = useQuantities[item.id] || 1
                                  onUseItem(item.id, quantity)
                                  setUseQuantities((prev) => ({ ...prev, [item.id]: 0 }))
                                }}
                                disabled={
                                  !useQuantities[item.id] ||
                                  useQuantities[item.id] > item.quantity ||
                                  item.quantity === 0
                                }
                                className="h-9 px-3 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                aria-label="Use/consume inventory"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Use/Consume Item</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2">
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
                              className="w-16 h-9 text-sm rounded-xl border-border/50"
                              aria-label="Quantity to restock"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const quantity = restockQuantities[item.id] || 1
                                    onRestockItem(item.id, quantity)
                                    setRestockQuantities((prev) => ({ ...prev, [item.id]: 0 }))
                                  }}
                                  disabled={!restockQuantities[item.id]}
                                  className="h-9 px-3 rounded-xl border-border/50 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30"
                                  aria-label="Restock inventory"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Restock Item</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}

                        {isAdmin && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditItem(item)}
                                className="h-9 px-3 rounded-xl hover:bg-primary/10 hover:text-primary"
                                aria-label="Edit item"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Item</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedItems.length === 0 && searchTerm && (
            <div className="text-center py-16 text-muted-foreground">
              <div className="p-6 rounded-3xl bg-muted/20 inline-flex mb-6">
                <Package className="h-12 w-12 opacity-50" />
              </div>
              <p className="text-xl font-serif font-bold mb-2">No items found</p>
              <p className="text-base font-medium">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
