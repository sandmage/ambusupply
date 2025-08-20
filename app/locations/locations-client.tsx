"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LocationTree } from "@/components/location-tree"
import { LocationForm } from "@/components/location-form"
import { StorageUnitForm } from "@/components/storage-unit-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface StorageUnit {
  id: string
  name: string
  type: string
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
}

export function LocationsClient({ locations: initialLocations, userRole }: LocationsClientProps) {
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
  const router = useRouter()

  const supabase = createClient()

  const handleAddLocation = () => {
    setEditingLocation(undefined)
    setIsLocationFormOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setIsLocationFormOpen(true)
  }

  const handleSaveLocation = async (locationData: Omit<Location, "id" | "storage_units">) => {
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
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (confirm("Are you sure you want to delete this location? This will also delete all storage units inside it.")) {
      const { error } = await supabase.from("locations").delete().eq("id", locationId)

      if (!error) {
        setLocations((prev) => prev.filter((loc) => loc.id !== locationId))
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

    if (unit) {
      // Update existing unit
      const { error } = await supabase
        .from("storage_units")
        .update({
          ...unitData,
          parent_unit_id: parentUnitId || null,
        })
        .eq("id", unit.id)

      if (!error) {
        router.refresh()
      }
    } else {
      // Create new unit
      const { error } = await supabase.from("storage_units").insert({
        ...unitData,
        location_id: locationId,
        parent_unit_id: parentUnitId || null,
      })

      if (!error) {
        router.refresh()
      }
    }
  }

  const handleDeleteStorageUnit = async (unitId: string, locationId: string) => {
    if (
      confirm("Are you sure you want to delete this storage unit? This will also delete all nested units inside it.")
    ) {
      const { error } = await supabase.from("storage_units").delete().eq("id", unitId)

      if (!error) {
        router.refresh()
      }
    }
  }

  const isAdmin = userRole === "admin"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-blue-600">Storage Locations</h1>
            {!isAdmin && <span className="ml-4 text-sm text-muted-foreground">(View Only)</span>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationTree
          locations={locations}
          onAddLocation={isAdmin ? handleAddLocation : undefined}
          onEditLocation={isAdmin ? handleEditLocation : undefined}
          onDeleteLocation={isAdmin ? handleDeleteLocation : undefined}
          onAddStorageUnit={isAdmin ? handleAddStorageUnit : undefined}
          onEditStorageUnit={isAdmin ? handleEditStorageUnit : undefined}
          onDeleteStorageUnit={isAdmin ? handleDeleteStorageUnit : undefined}
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
      </main>
    </div>
  )
}
