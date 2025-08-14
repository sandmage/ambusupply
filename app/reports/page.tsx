import { ReportsHeader } from "@/components/reports/reports-header"
import { ReportsOverview } from "@/components/reports/reports-overview"
import { FleetAnalytics } from "@/components/reports/fleet-analytics"
import { InventoryAnalytics } from "@/components/reports/inventory-analytics"
import { OrderAnalytics } from "@/components/reports/order-analytics"
import { PerformanceMetrics } from "@/components/reports/performance-metrics"
import { DailyChecksAnalytics } from "@/components/reports/daily-checks-analytics"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <ReportsHeader />
          <ReportsOverview />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="min-w-0 w-full overflow-hidden">
              <FleetAnalytics />
            </div>
            <div className="min-w-0 w-full overflow-hidden">
              <InventoryAnalytics />
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="min-w-0 w-full overflow-hidden">
              <OrderAnalytics />
            </div>
            <div className="min-w-0 w-full overflow-hidden">
              <PerformanceMetrics />
            </div>
          </div>
          <div className="min-w-0 w-full overflow-hidden">
            <DailyChecksAnalytics />
          </div>
        </div>
      </div>
    </div>
  )
}
