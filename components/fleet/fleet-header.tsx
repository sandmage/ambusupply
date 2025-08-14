"use client"

import { Button } from "@/components/ui/button"
import { Plus, Settings, ClipboardCheck, FileText, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function FleetHeader() {
  const router = useRouter()

  const handleSettings = () => {
    router.push("/settings")
  }

  const handleAddVehicle = () => {
    toast.info("Add Vehicle", {
      description: "Add vehicle form will open here. Feature in development.",
    })
  }

  const handleDailyChecks = () => {
    router.push("/fleet/daily-checks")
  }

  const handleDocuments = () => {
    router.push("/fleet/documents")
  }

  const handleMaintenance = () => {
    router.push("/fleet/maintenance")
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Fleet Management & Records</h1>
        <p className="text-muted-foreground mt-1">Manage vehicle records, maintenance, and compliance documentation</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleDailyChecks}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Daily Checks
        </Button>
        <Button variant="outline" size="sm" onClick={handleMaintenance}>
          <Wrench className="h-4 w-4 mr-2" />
          Maintenance
        </Button>
        <Button variant="outline" size="sm" onClick={handleDocuments}>
          <FileText className="h-4 w-4 mr-2" />
          Documents
        </Button>
        <Button variant="outline" size="sm" onClick={handleSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAddVehicle}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </Button>
      </div>
    </div>
  )
}
