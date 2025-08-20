import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { HierarchicalInventoryClient } from "./hierarchical-inventory-client"

export default async function HierarchicalInventoryPage() {
  const supabase = createClient()

  const { data: hierarchicalInventory } = await supabase
    .from("hierarchical_inventory_overview")
    .select("*")
    .order("parent_item_name")

  const { data: locations } = await supabase.from("locations").select("*").order("name")

  const { data: storageUnits } = await supabase.from("storage_units").select("*").order("name")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hierarchy-heading text-3xl">Hierarchical Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Manage inventory allocations from headquarters to field locations
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading hierarchical inventory...</div>}>
        <HierarchicalInventoryClient
          initialInventory={hierarchicalInventory || []}
          locations={locations || []}
          storageUnits={storageUnits || []}
        />
      </Suspense>
    </div>
  )
}
