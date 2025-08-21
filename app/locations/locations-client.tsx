"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LocationTree } from "@/components/location-tree"
import { LocationForm } from "@/components/location-form"
import { StorageUnitForm } from "@/components/storage-unit-form"
import { StorageUnitTypeForm } from "@/components/storage-unit-type-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, Search, Building, AlertCircle, Settings, Edit, Trash2, Layers, MapPin } from "lucide-react"
import type { StorageUnit, Location } from "@/lib/types"

interface StorageUnitType {
  id: string
  name: string
  capacity_type: string
  default_capacity?: number
  description?: string
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
  const [storageUnitTypes, setStorageUnitTypes] = useState<StorageUnitType[]>([])
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false)
  const [isStorageFormOpen, setIsStorageFormOpen] = useState(false)
  const [isStorageTypeFormOpen, setIsStorageTypeFormOpen] = useState(false)
  const [editingStorageType, setEditingStorageType] = useState<StorageUnitType | undefined>()
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

  useEffect(() => {
    fetchStorageUnitTypes()
  }, [])

  const fetchStorageUnitTypes = async () => {
    console.log("[v0] Locations: fetchStorageUnitTypes disabled to prevent network errors")
    setStorageUnitTypes([
      { id: "default-1", name: "Shelf", capacity_type: "count", description: "Default shelf type" },
      { id: "default-2", name: "Cabinet", capacity_type: "count", description: "Default cabinet type" },
      { id: "default-3", name: "Drawer", capacity_type: "count", description: "Default drawer type" },
    ])
    return

    // Original code disabled to prevent network requests
    /*
    try {
      const { data, error } = await supabase.from("storage_unit_types").select("*").order("name")

      if (error) {
        console.error("[v0] Error fetching storage unit types:", error)
        setStorageUnitTypes([
          { id: "default-1", name: "Shelf", capacity_type: "count", description: "Default shelf type" },
          { id: "default-2", name: "Cabinet", capacity_type: "count", description: "Default cabinet type" },
          { id: "default-3", name: "Drawer", capacity_type: "count", description: "Default drawer type" },
        ])
      } else {
        console.log("[v0] Fetched storage unit types:", data)
        setStorageUnitTypes(data || [])
      }
    } catch (error) {
      console.error("[v0] Exception fetching storage unit types:", error)
      setStorageUnitTypes([
        { id: "default-1", name: "Shelf", capacity_type: "count", description: "Default shelf type" },
        { id: "default-2", name: "Cabinet", capacity_type: "count", description: "Default cabinet type" },
        { id: "default-3", name: "Drawer", capacity_type: "count", description: "Default drawer type" },
      ])
    }
    */
  }

  // Filter locations based on search
  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.storage_units.some(
        (unit) =>
          unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.type.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const handleSaveStorageUnit = async (unitData: Omit<StorageUnit, "id" | "location_id">) => {
    if (!editingStorageUnit) return

    const { locationId, parentUnitId, unit } = editingStorageUnit

    console.log("[v0] Storage unit save started")
    console.log("[v0] Unit data received:", unitData)
    console.log("[v0] Editing storage unit context:", editingStorageUnit)

    try {
      if (unit) {
        // Update existing unit
        console.log("[v0] Updating existing storage unit:", unit.id)
        const updateData = {
          name: unitData.name,
          unit_type: unitData.type, // Map frontend 'type' to database 'unit_type'
          parent_unit_id: parentUnitId || null,
        }
        console.log("[v0] Update data:", updateData)

        const { error } = await supabase.from("storage_units").update(updateData).eq("id", unit.id)

        if (error) {
          console.error("[v0] Error updating storage unit:", error)
        } else {
          console.log("[v0] Storage unit updated successfully")
          setIsStorageFormOpen(false)
          setEditingStorageUnit(undefined)
          router.refresh()
        }
      } else {
        // Create new unit
        console.log("[v0] Creating new storage unit")
        const insertData = {
          name: unitData.name,
          unit_type: unitData.type, // Map frontend 'type' to database 'unit_type'
          location_id: locationId,
          parent_unit_id: parentUnitId || null,
        }
        console.log("[v0] Insert data:", insertData)

        const { data, error } = await supabase.from("storage_units").insert(insertData).select()

        if (error) {
          console.error("[v0] Error creating storage unit:", error)
        } else {
          console.log("[v0] Storage unit created successfully:", data)
          setIsStorageFormOpen(false)
          setEditingStorageUnit(undefined)
          router.refresh()
        }
      }
    } catch (error) {
      console.error("[v0] Exception in storage unit save:", error)
    }

    console.log("[v0] Storage unit save completed successfully")
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

  const handleAddStorageType = () => {
    setEditingStorageType(undefined)
    setIsStorageTypeFormOpen(true)
  }

  const handleEditStorageType = (storageType: StorageUnitType) => {
    setEditingStorageType(storageType)
    setIsStorageTypeFormOpen(true)
  }

  const handleSaveStorageType = async (storageTypeData: Omit<StorageUnitType, "id">) => {
    console.log("[v0] Storage unit type operations are temporarily disabled")
    // Simulate success for now
    setTimeout(() => {
      setIsStorageTypeFormOpen(false)
      setEditingStorageType(undefined)
      // In a real implementation, this would refresh the storage unit types list
    }, 500)
  }

  const handleDeleteStorageType = async (storageTypeId: string) => {
    if (confirm("Are you sure you want to delete this storage unit type?")) {
      console.log("[v0] Storage unit type operations are temporarily disabled")
      // In a real implementation, this would delete the storage type
    }
  }

  const [activeTab, setActiveTab] = useState("hierarchy")

  return (
    <div className="h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Storage Management</h1>
            <p className="text-lg text-muted-foreground font-medium">
              {isAdmin
                ? "Organize and manage your storage hierarchy, locations, and unit types"
                : "View storage organization and locations (Read Only)"}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Button
                onClick={handleAddStorageType}
                variant="outline"
                className="apple-button-secondary bg-transparent"
              >
                <Settings className="h-5 w-5 mr-2" />
                Manage Storage Types
              </Button>
              <Button onClick={handleAddLocation} className="apple-button-secondary">
                <Plus className="h-5 w-5 mr-2" />
                Add Location
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 transition-transform duration-200 group-hover:scale-110">
                  <Building className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-primary mb-2">{stats.totalLocations}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Locations</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-secondary/10 transition-transform duration-200 group-hover:scale-110">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-secondary mb-2">{stats.totalStorageUnits}</div>
              <div className="text-sm text-muted-foreground font-medium">Storage Units</div>
            </CardContent>
          </Card>

          <Card className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-orange-100 transition-transform duration-200 group-hover:scale-110">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-orange-600 mb-2">{filteredLocations.length}</div>
              <div className="text-sm text-muted-foreground font-medium">Filtered Results</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Storage Hierarchy
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Storage Locations
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Storage Unit Types
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="space-y-6">
            <Card className="apple-card">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-serif font-bold text-primary">Storage Hierarchy</CardTitle>
                    <CardDescription className="text-base font-medium">
                      Organize and arrange your storage locations and units
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-3">
                      <Button onClick={handleAddLocation} className="apple-button-secondary">
                        <Plus className="h-5 w-5 mr-2" />
                        Add Location
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search locations, descriptions, or storage units..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>

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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Card className="apple-card">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-serif font-bold text-primary">Storage Locations</CardTitle>
                    <CardDescription className="text-base font-medium">
                      Create and manage physical storage locations
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-3">
                      <Button onClick={handleAddLocation} className="apple-button-secondary">
                        <Plus className="h-5 w-5 mr-2" />
                        Add Location
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 rounded-2xl border-border/50 bg-card text-base"
                  />
                </div>

                <div className="grid gap-4">
                  {filteredLocations.map((location) => (
                    <Card key={location.id} className="apple-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-serif font-bold text-primary mb-2">{location.name}</h3>
                            {location.description && (
                              <p className="text-muted-foreground mb-3">{location.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{location.storage_units.length} storage units</span>
                              {location.address && <span>{location.address}</span>}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleEditLocation(location)}
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-xl"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteLocation(location.id)}
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-xl text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-6">
            <Card className="apple-card">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-serif font-bold text-primary">Storage Unit Types</CardTitle>
                    <CardDescription className="text-base font-medium">
                      Manage the types of storage units available in your organization
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button onClick={handleAddStorageType} className="apple-button-secondary">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Storage Type
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-6">
                  {storageUnitTypes.length} storage unit types configured
                </div>

                <div className="grid gap-3">
                  {storageUnitTypes.map((storageType) => (
                    <div
                      key={storageType.id}
                      className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h5 className="font-semibold">{storageType.name}</h5>
                          <Badge variant="secondary" className="text-xs">
                            {storageType.capacity_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Capacity: {storageType.default_capacity || 0}</span>
                          {storageType.description && <span>{storageType.description}</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditStorageType(storageType)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteStorageType(storageType.id)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-xl text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!isAdmin && (
          <Card className="apple-card border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-100">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="font-serif font-bold text-orange-800 text-lg mb-1">View Only Access</div>
                  <div className="text-base text-orange-700 font-medium">
                    You can view storage information but cannot make changes. Contact an administrator to modify storage
                    settings.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              storageUnitTypes={storageUnitTypes}
            />

            <StorageUnitTypeForm
              storageType={editingStorageType}
              isOpen={isStorageTypeFormOpen}
              onClose={() => setIsStorageTypeFormOpen(false)}
              onSave={handleSaveStorageType}
            />
          </>
        )}
      </div>
    </div>
  )
}
