"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, MapPin, Package, Building2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Location, StorageUnit } from "@/lib/types"

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
        return <Building2 className="h-5 w-5" />
      case "shelf":
        return <Layers className="h-5 w-5" />
      case "drawer":
        return <Package className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getUnitTypeBadge = (type: string) => {
    const colors = {
      cabinet: "bg-primary/10 text-primary border-primary/20",
      shelf: "bg-secondary/10 text-secondary border-secondary/20",
      drawer: "bg-orange-100 text-orange-700 border-orange-200",
      compartment: "bg-purple-100 text-purple-700 border-purple-200",
    }

    const colorClass =
      colors[type.toLowerCase() as keyof typeof colors] || "bg-muted text-muted-foreground border-border"

    return (
      <Badge variant="outline" className={`text-sm font-medium px-3 py-1 rounded-xl ${colorClass}`}>
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
        <mark key={index} className="bg-yellow-200 px-1 rounded-lg">
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
      <div key={unit.id} className="ml-6">
        <div className="flex items-center gap-4 py-4 px-5 hover:bg-muted/30 rounded-2xl group transition-all duration-200 border border-transparent hover:border-border/50 hover:shadow-sm">
          <button
            onClick={() => toggleUnit(unit.id)}
            className="p-2 hover:bg-muted rounded-xl transition-all duration-200"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )
            ) : (
              <div className="h-5 w-5" />
            )}
          </button>

          <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
            {getUnitTypeIcon(unit.type)}
          </div>

          <div className="flex-1 flex items-center gap-4">
            <span className="font-semibold text-foreground text-base">{highlightText(unit.name, searchTerm)}</span>
            {getUnitTypeBadge(unit.type)}
            {unit.description && (
              <span className="text-sm text-muted-foreground font-medium">
                {highlightText(unit.description, searchTerm)}
              </span>
            )}
          </div>

          {!isReadOnly && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all duration-200">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAddStorageUnit?.(locationId, unit.id)}
                className="h-9 w-9 p-0 rounded-xl hover:bg-secondary/10 hover:text-secondary hover:scale-105 transition-all duration-200"
                title="Add nested storage unit"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditStorageUnit?.(unit, locationId)}
                className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
                title="Edit storage unit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteStorageUnit?.(unit.id, locationId)}
                className="h-9 w-9 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all duration-200"
                title="Delete storage unit"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-6 border-l-2 border-border/30 pl-4 mt-2">
            {unit.children!.map((childUnit) => renderStorageUnit(childUnit, locationId, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <Card className="apple-card">
        <CardContent className="p-16 text-center">
          <div className="p-6 rounded-3xl bg-primary/10 inline-flex mb-6">
            <MapPin className="h-16 w-16 text-primary" />
          </div>
          <h3 className="text-2xl font-serif font-bold mb-3 text-primary">No storage locations yet</h3>
          <p className="text-lg text-muted-foreground mb-6 font-medium">
            Create your first storage location to organize your medical supplies
          </p>
          {onAddLocation && (
            <Button onClick={onAddLocation} className="apple-button-secondary">
              <Plus className="h-5 w-5 mr-2" />
              Add First Location
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="apple-card">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-serif font-bold text-primary">Storage Hierarchy</CardTitle>
            <CardDescription className="text-base font-medium mt-2">
              Organized view of all storage locations and units • {locations.length} locations
            </CardDescription>
          </div>
          {onAddLocation && (
            <Button onClick={onAddLocation} className="apple-button-secondary">
              <Plus className="h-5 w-5 mr-2" />
              Add Location
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
            <Card
              key={location.id}
              className="apple-card hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => toggleLocation(location.id)}
                    className="p-3 hover:bg-muted rounded-2xl transition-all duration-200"
                    disabled={!hasStorageUnits}
                  >
                    {hasStorageUnits ? (
                      isExpanded ? (
                        <ChevronDown className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                      )
                    ) : (
                      <div className="h-6 w-6" />
                    )}
                  </button>

                  <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl shadow-sm">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold text-primary mb-1">
                      {highlightText(location.name, searchTerm)}
                    </h3>
                    {location.description && (
                      <p className="text-base text-muted-foreground font-medium mb-2">
                        {highlightText(location.description, searchTerm)}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-medium px-3 py-1 rounded-xl">
                        {unitCount} storage units
                      </Badge>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddStorageUnit?.(location.id)}
                        className="apple-button-secondary h-10 px-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Storage
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditLocation?.(location)}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteLocation?.(location.id)}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {isExpanded && hasStorageUnits && (
                  <div className="border-t border-border/30 pt-6">
                    {location.storage_units.map((unit) => renderStorageUnit(unit, location.id))}
                  </div>
                )}

                {!hasStorageUnits && (
                  <div className="border-t border-border/30 pt-6">
                    <div className="p-8 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl text-center">
                      <div className="p-4 rounded-2xl bg-muted/50 inline-flex mb-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base text-muted-foreground mb-4 font-medium">
                        No storage units in this location
                      </p>
                      {onAddStorageUnit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAddStorageUnit(location.id)}
                          className="apple-button-secondary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
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
