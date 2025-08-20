"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronDown, ChevronRight, Package, MapPin } from "lucide-react"
import { AllocationDialog } from "@/components/allocation-dialog"

interface HierarchicalInventoryItem {
  parent_item_id: string
  parent_item_name: string
  parent_quantity: number
  parent_location_name: string
  parent_location_id: string
  total_allocated: number
  total_current_allocated: number
  available_for_allocation: number
  allocations: Array<{
    allocation_id: string
    child_location_id: string
    child_location_name: string
    allocated_quantity: number
    current_quantity: number
    par_level: number
  }> | null
}

interface Location {
  id: string
  name: string
  description?: string
}

interface StorageUnit {
  id: string
  name: string
  location_id: string
}

interface HierarchicalInventoryClientProps {
  initialInventory: HierarchicalInventoryItem[]
  locations: Location[]
  storageUnits: StorageUnit[]
}

export function HierarchicalInventoryClient({
  initialInventory,
  locations,
  storageUnits,
}: HierarchicalInventoryClientProps) {
  const [inventory, setInventory] = useState(initialInventory)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false)
  const [selectedParentItem, setSelectedParentItem] = useState<HierarchicalInventoryItem | null>(null)

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleAllocate = (item: HierarchicalInventoryItem) => {
    setSelectedParentItem(item)
    setAllocationDialogOpen(true)
  }

  const getAvailableLocations = (parentLocationId: string) => {
    return locations.filter((loc) => loc.id !== parentLocationId)
  }

  const getStorageUnitsForLocation = (locationId: string) => {
    return storageUnits.filter((unit) => unit.location_id === locationId)
  }

  const getAllocationStatus = (allocated: number, current: number) => {
    const percentage = allocated > 0 ? (current / allocated) * 100 : 0
    if (percentage >= 90) return "allocation-full"
    if (percentage >= 50) return "allocation-partial"
    return "allocation-low"
  }

  return (
    <div className="space-y-4">
      {inventory.map((item) => {
        const isExpanded = expandedItems.has(item.parent_item_id)
        const hasAllocations = item.allocations && item.allocations.length > 0

        return (
          <Card key={item.parent_item_id} className="hierarchy-card parent-location">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" onClick={() => toggleExpanded(item.parent_item_id)} className="p-1">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{item.parent_item_name}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{item.parent_location_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Stock</div>
                    <div className="font-semibold">{item.parent_quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Allocated</div>
                    <div className="font-semibold text-primary">{item.total_allocated}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Available</div>
                    <div className="font-semibold text-secondary">{item.available_for_allocation}</div>
                  </div>
                  <Button onClick={() => handleAllocate(item)} className="hierarchy-button" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Allocate
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && hasAllocations && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Allocated to Field Locations:</div>

                  {item.allocations!.map((allocation) => (
                    <Card key={allocation.allocation_id} className="child-location">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{allocation.child_location_name}</div>
                              <div className="text-sm text-muted-foreground">Par Level: {allocation.par_level}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Allocated</div>
                              <div className="font-semibold">{allocation.allocated_quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">Current</div>
                              <div className="font-semibold">{allocation.current_quantity}</div>
                            </div>
                            <Badge
                              className={`allocation-indicator ${getAllocationStatus(
                                allocation.allocated_quantity,
                                allocation.current_quantity,
                              )}`}
                            >
                              {allocation.current_quantity > 0
                                ? `${Math.round((allocation.current_quantity / allocation.allocated_quantity) * 100)}%`
                                : "0%"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            )}

            {isExpanded && !hasAllocations && (
              <CardContent className="pt-0">
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No allocations yet</p>
                  <p className="text-sm">Click "Allocate" to distribute inventory to field locations</p>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {selectedParentItem && (
        <AllocationDialog
          open={allocationDialogOpen}
          onOpenChange={setAllocationDialogOpen}
          parentItem={selectedParentItem}
          availableLocations={getAvailableLocations(selectedParentItem.parent_location_id)}
          storageUnits={storageUnits}
          onAllocationComplete={() => {
            // Refresh inventory data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
