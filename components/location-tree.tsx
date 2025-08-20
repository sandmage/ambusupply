"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, MapPin, Package, Building2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface LocationTreeProps {
  locations: Location[]
  onAddLocation?: () => void
  onEditLocation?: (location: Location) => void
  onDeleteLocation?: (locationId: string) => void
  onAddStorageUnit?: (locationId: string, parentUnitId?: string) => void
  onEditStorageUnit?: (unit: StorageUnit, locationId: string) => void
  onDeleteStorageUnit?: (unitId: string, locationId: string) => void
  searchTerm?: string
}

export function LocationTree({
  locations,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  onAddStorageUnit,
  onEditStorageUnit,
  onDeleteStorageUnit,
  searchTerm = "",
}: LocationTreeProps) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  const isReadOnly = !onAddLocation

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

  const getUnitTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "cabinet":
        return <Building2 className="h-4 w-4" />
      case "shelf":
        return <Layers className="h-4 w-4" />
      case "drawer":
        return <Package className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getUnitTypeBadge = (type: string) => {
    const colors = {
      cabinet: "bg-primary/10 text-primary",
      shelf: "bg-secondary/10 text-secondary",
      drawer: "bg-orange-100 text-orange-700",
      compartment: "bg-purple-100 text-purple-700",
    }

    const colorClass = colors[type.toLowerCase() as keyof typeof colors] || "bg-muted text-muted-foreground"

    return (
      <Badge variant="outline" className={`text-xs ${colorClass} border-0`}>
        {type}
      </Badge>
    )
  }

  const highlightText = (text: string, search: string) => {
    if (!search) return text

    const regex = new RegExp(`(${search})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const renderStorageUnit = (unit: StorageUnit, locationId: string, level = 0) => {
    const hasChildren = unit.children && unit.children.length > 0
    const isExpanded = expandedUnits.has(unit.id)

    return (
      <div key={unit.id} className="ml-4">
        <div className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 rounded-lg group transition-colors border border-transparent hover:border-border">
          <button
            onClick={() => toggleUnit(unit.id)}
            className="p-1 hover:bg-muted rounded transition-colors"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </button>

          <div className="flex items-center gap-2">{getUnitTypeIcon(unit.unit_type)}</div>

          <div className="flex-1 flex items-center gap-3">
            <span className="font-medium text-foreground">{highlightText(unit.name, searchTerm)}</span>
            {getUnitTypeBadge(unit.unit_type)}
            {unit.description && (
              <span className="text-sm text-muted-foreground">{highlightText(unit.description, searchTerm)}</span>
            )}
          </div>

          {!isReadOnly && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddStorageUnit?.(locationId, unit.id)}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                title="Add nested storage unit"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditStorageUnit?.(unit, locationId)}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                title="Edit storage unit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteStorageUnit?.(unit.id, locationId)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Delete storage unit"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 border-l-2 border-border pl-2">
            {unit.children!.map((childUnit) => renderStorageUnit(childUnit, locationId, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No storage locations yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first storage location to organize your medical supplies
          </p>
          {onAddLocation && (
            <Button onClick={onAddLocation} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add First Location
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="medical-heading">Storage Hierarchy</CardTitle>
            <CardDescription>
              Organized view of all storage locations and units • {locations.length} locations
            </CardDescription>
          </div>
          {onAddLocation && (
            <Button onClick={onAddLocation} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {locations.map((location) => {
          const isExpanded = expandedLocations.has(location.id)
          const hasStorageUnits = location.storage_units.length > 0
          const unitCount = location.storage_units.reduce((count, unit) => {
            const countUnits = (units: StorageUnit[]): number => {
              return units.reduce((acc, u) => acc + 1 + (u.children ? countUnits(u.children) : 0), 0)
            }
            return count + countUnits([unit])
          }, 0)

          return (
            <Card key={location.id} className="border-border hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => toggleLocation(location.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    disabled={!hasStorageUnits}
                  >
                    {hasStorageUnits ? (
                      isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </button>

                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {highlightText(location.name, searchTerm)}
                    </h3>
                    {location.description && (
                      <p className="text-sm text-muted-foreground">{highlightText(location.description, searchTerm)}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {unitCount} storage units
                      </Badge>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddStorageUnit?.(location.id)}
                        className="hover:bg-secondary/10 hover:text-secondary hover:border-secondary"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Storage
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditLocation?.(location)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteLocation?.(location.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isExpanded && hasStorageUnits && (
                  <div className="border-t border-border pt-4">
                    {location.storage_units.map((unit) => renderStorageUnit(unit, location.id))}
                  </div>
                )}

                {!hasStorageUnits && (
                  <div className="border-t border-border pt-4">
                    <div className="p-6 bg-muted/30 rounded-lg text-center">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground mb-3">No storage units in this location</p>
                      {onAddStorageUnit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAddStorageUnit(location.id)}
                          className="hover:bg-secondary/10 hover:text-secondary hover:border-secondary"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Storage Unit
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
