"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LocationTree } from "@/components/location-tree"
import { LocationForm } from "@/components/location-form"
import { StorageUnitForm } from "@/components/storage-unit-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Package, Search, Building, AlertCircle } from "lucide-react"

interface StorageUnit {
  id: string
  name: string
  unit_type: string
  position_order: number
  description?: string
  children?: StorageUnit[]
}

interface Location {
  id: string
  name: string
  description?: string
  storage_units: StorageUnit[]
}

interface LocationsClientProps {
  locations: Location[]
  userRole: string
  stats: {
    totalLocations: number
    totalStorageUnits: number
  }
}

export function LocationsClient({ locations: initialLocations, userRole, stats }: LocationsClientProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false)
  const [isStorageFormOpen, setIsStorageFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | undefined>()
  const [editingStorageUnit, setEditingStorageUnit] = useState<{
    unit?: StorageUnit
    locationId: string
    parentUnitId?: string
    parentUnitName?: string
  }>()
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const supabase = createClient()
  const isAdmin = userRole === "admin"

  // Filter locations based on search
  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.storage_units.some(
        (unit) =>
          unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.unit_type.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    return matchesSearch
  })

  const handleAddLocation = () => {
    setEditingLocation(undefined)
    setIsLocationFormOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setIsLocationFormOpen(true)
  }

  const handleSaveLocation = async (locationData: Omit<Location, "id" | "storage_units">) => {
    try {
      if (editingLocation) {
        // Update existing location
        const { error } = await supabase.from("locations").update(locationData).eq("id", editingLocation.id)

        if (!error) {
          setLocations((prev) => prev.map((loc) => (loc.id === editingLocation.id ? { ...loc, ...locationData } : loc)))
        }
      } else {
        // Create new location
        const { data, error } = await supabase.from("locations").insert(locationData).select().single()

        if (!error && data) {
          setLocations((prev) => [...prev, { ...data, storage_units: [] }])
        }
      }
    } catch (error) {
      console.error("Error saving location:", error)
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (confirm("Are you sure you want to delete this location? This will also delete all storage units inside it.")) {
      try {
        const { error } = await supabase.from("locations").delete().eq("id", locationId)

        if (!error) {
          setLocations((prev) => prev.filter((loc) => loc.id !== locationId))
        }
      } catch (error) {
        console.error("Error deleting location:", error)
      }
    }
  }

  const handleAddStorageUnit = (locationId: string, parentUnitId?: string) => {
    const location = locations.find((loc) => loc.id === locationId)
    let parentUnitName: string | undefined

    if (parentUnitId && location) {
      // Find parent unit name recursively
      const findUnitName = (units: StorageUnit[]): string | undefined => {
        for (const unit of units) {
          if (unit.id === parentUnitId) return unit.name
          if (unit.children) {
            const found = findUnitName(unit.children)
            if (found) return found
          }
        }
        return undefined
      }
      parentUnitName = findUnitName(location.storage_units)
    }

    setEditingStorageUnit({
      locationId,
      parentUnitId,
      parentUnitName,
    })
    setIsStorageFormOpen(true)
  }

  const handleEditStorageUnit = (unit: StorageUnit, locationId: string) => {
    setEditingStorageUnit({
      unit,
      locationId,
    })
    setIsStorageFormOpen(true)
  }

  const handleSaveStorageUnit = async (unitData: Omit<StorageUnit, "id" | "children">) => {
    if (!editingStorageUnit) return

    const { locationId, parentUnitId, unit } = editingStorageUnit

    try {
      if (unit) {
        // Update existing unit
        const { error } = await supabase
          .from("storage_units")
          .update({
            name: unitData.name,
            unit_type: unitData.unit_type,
            parent_unit_id: parentUnitId || null,
          })
          .eq("id", unit.id)

        if (!error) {
          router.refresh()
        }
      } else {
        // Create new unit
        const { error } = await supabase.from("storage_units").insert({
          name: unitData.name,
          unit_type: unitData.unit_type,
          location_id: locationId,
          parent_unit_id: parentUnitId || null,
        })

        if (!error) {
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error saving storage unit:", error)
    }
  }

  const handleDeleteStorageUnit = async (unitId: string, locationId: string) => {
    if (
      confirm("Are you sure you want to delete this storage unit? This will also delete all nested units inside it.")
    ) {
      try {
        const { error } = await supabase.from("storage_units").delete().eq("id", unitId)

        if (!error) {
          router.refresh()
        }
      } catch (error) {
        console.error("Error deleting storage unit:", error)
      }
    }
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground medical-heading">Storage Locations</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? "Manage physical storage locations and organizational units"
                  : "View storage locations (Read Only)"}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={handleAddLocation} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.totalLocations}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Locations</div>
                </div>
                <Building className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-secondary">{stats.totalStorageUnits}</div>
                  <div className="text-sm text-muted-foreground font-medium">Storage Units</div>
                </div>
                <Package className="h-8 w-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-500">{filteredLocations.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">Filtered Results</div>
                </div>
                <Search className="h-8 w-8 text-orange-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="medical-heading">Search & Filter</CardTitle>
            <CardDescription>Find locations and storage units quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations, descriptions, or storage units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {!isAdmin && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-medium">View Only Access</div>
                  <div className="text-sm">
                    You can view location information but cannot make changes. Contact an administrator to modify
                    locations.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <LocationTree
          locations={filteredLocations}
          onAddLocation={isAdmin ? handleAddLocation : undefined}
          onEditLocation={isAdmin ? handleEditLocation : undefined}
          onDeleteLocation={isAdmin ? handleDeleteLocation : undefined}
          onAddStorageUnit={isAdmin ? handleAddStorageUnit : undefined}
          onEditStorageUnit={isAdmin ? handleEditStorageUnit : undefined}
          onDeleteStorageUnit={isAdmin ? handleDeleteStorageUnit : undefined}
          searchTerm={searchTerm}
        />

        {isAdmin && (
          <>
            <LocationForm
              location={editingLocation}
              isOpen={isLocationFormOpen}
              onClose={() => setIsLocationFormOpen(false)}
              onSave={handleSaveLocation}
            />

            <StorageUnitForm
              unit={editingStorageUnit?.unit}
              isOpen={isStorageFormOpen}
              onClose={() => setIsStorageFormOpen(false)}
              onSave={handleSaveStorageUnit}
              parentUnitName={editingStorageUnit?.parentUnitName}
            />
          </>
        )}
      </div>
    </div>
  )
}
