import { FleetHeader } from "@/components/fleet/fleet-header"
import { FleetStats } from "@/components/fleet/fleet-stats"
import { FleetList } from "@/components/fleet/fleet-list"
import { FleetFilters } from "@/components/fleet/fleet-filters"
import { MaintenanceOverview } from "@/components/fleet/maintenance-overview"
import { ComplianceAlerts } from "@/components/fleet/compliance-alerts"

export default function FleetPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <FleetHeader />
        <FleetStats />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MaintenanceOverview />
            <FleetList />
          </div>
          <div className="space-y-6">
            <ComplianceAlerts />
            <FleetFilters />
          </div>
        </div>
      </div>
    </div>
  )
}
