"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function InventoryHeader() {
  const router = useRouter()

  const handleImport = () => {
    toast.info("Import functionality coming soon!", {
      description: "File import feature will be available in the next update.",
    })
  }

  const handleExport = () => {
    toast.success("Inventory exported successfully!", {
      description: "Your inventory data has been downloaded as CSV.",
    })

    // Simulate file download
    const csvContent =
      "data:text/csv;charset=utf-8,ID,Name,Category,Stock,Price\nINV-001,Oxygen Tank,Emergency,3,$125.00"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "inventory_export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddItem = () => {
    toast.info("Add Item Modal", {
      description: "Add item form will open here. Feature in development.",
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Medical Supply Inventory</h1>
        <p className="text-muted-foreground mt-1">Manage and track all medical supplies and equipment</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>
  )
}
