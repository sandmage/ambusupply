import { OrdersHeader } from "@/components/orders/orders-header"
import { OrdersStats } from "@/components/orders/orders-stats"
import { OrdersFilters } from "@/components/orders/orders-filters"
import { OrdersTable } from "@/components/orders/orders-table"
import { QuickOrder } from "@/components/orders/quick-order"

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <OrdersHeader />
        <OrdersStats />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <OrdersFilters />
            <OrdersTable />
          </div>
          <div>
            <QuickOrder />
          </div>
        </div>
      </div>
    </div>
  )
}
