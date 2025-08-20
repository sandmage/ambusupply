"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface LocationTreeProps {
  locations: Location[]
  onAddLocation: () => void
  onEditLocation: (location: Location) => void
  onDeleteLocation: (locationId: string) => void
  onAddStorageUnit: (locationId: string, parentUnitId?: string) => void
  onEditStorageUnit: (unit: StorageUnit, locationId: string) => void
  onDeleteStorageUnit: (unitId: string, locationId: string) => void
}

export function LocationTree({
  locations,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onAddStorageUnit,
  onEditStorageUnit,
  onDeleteStorageUnit,
}: LocationTreeProps) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  const toggleLocation = (locationId: string) => {
    const newExpanded = new Set(expandedLocations)
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId)
    } else {
      newExpanded.add(locationId)
    }
    setExpandedLocations(newExpanded)
  }

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits)
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId)
    } else {
      newExpanded.add(unitId)
    }
    setExpandedUnits(newExpanded)
  }

  const renderStorageUnit = (unit: StorageUnit, locationId: string, level = 0) => {
    const hasChildren = unit.children && unit.children.length > 0
    const isExpanded = expandedUnits.has(unit.id)

    return (
      <div key={unit.id} className={`ml-${level * 4}`}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-md group">
          <button onClick={() => toggleUnit(unit.id)} className="p-1 hover:bg-gray-200 rounded" disabled={!hasChildren}>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium">{unit.name}</span>
            <Badge variant="secondary" className="text-xs">
              {unit.type}
            </Badge>
            {unit.description && <span className="text-sm text-muted-foreground">- {unit.description}</span>}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddStorageUnit(locationId, unit.id)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditStorageUnit(unit, locationId)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteStorageUnit(unit.id, locationId)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4">
            {unit.children!.map((childUnit) => renderStorageUnit(childUnit, locationId, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Storage Locations</h2>
        <Button onClick={onAddLocation}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-muted-foreground mb-4">Create your first storage location to get started.</p>
            <Button onClick={onAddLocation}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {locations.map((location) => {
            const isExpanded = expandedLocations.has(location.id)
            const hasStorageUnits = location.storage_units.length > 0

            return (
              <Card key={location.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleLocation(location.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                      disabled={!hasStorageUnits}
                    >
                      {hasStorageUnits ? (
                        isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                    </button>

                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{location.name}</h3>
                      {location.description && <p className="text-sm text-muted-foreground">{location.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onAddStorageUnit(location.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Storage
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEditLocation(location)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteLocation(location.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && hasStorageUnits && (
                    <div className="mt-4 border-l-2 border-gray-200 ml-3">
                      {location.storage_units.map((unit) => renderStorageUnit(unit, location.id))}
                    </div>
                  )}

                  {!hasStorageUnits && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md text-center">
                      <p className="text-sm text-muted-foreground mb-2">No storage units in this location</p>
                      <Button size="sm" variant="outline" onClick={() => onAddStorageUnit(location.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add First Storage Unit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
