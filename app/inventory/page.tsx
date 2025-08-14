import { InventoryHeader } from "@/components/inventory/inventory-header"
import { InventoryFilters } from "@/components/inventory/inventory-filters"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { InventoryStats } from "@/components/inventory/inventory-stats"

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <InventoryHeader />
        <InventoryStats />
        <div className="space-y-4">
          <InventoryFilters />
          <InventoryTable />
        </div>
      </div>
    </div>
  )
}
