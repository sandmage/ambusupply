"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Plus,
  ChevronRight,
  ChevronDown,
  MapPin,
  Package,
  Edit,
  Trash2,
  FolderOpen,
  Archive,
} from "lucide-react"

interface Location {
  id: string
  name: string
  type: "building" | "room" | "cabinet" | "shelf" | "container"
  parentId?: string
  description?: string
  capacity?: number
  assignedItems: string[]
  children?: Location[]
}

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([
    {
      id: "LOC-001",
      name: "Headquarters",
      type: "building",
      description: "Main facility building",
      capacity: 1000,
      assignedItems: [],
      children: [
        {
          id: "LOC-002",
          name: "Main Storage Closet",
          type: "room",
          parentId: "LOC-001",
          description: "Primary inventory storage room",
          capacity: 500,
          assignedItems: ["INV-001", "INV-002"],
          children: [],
        },
        {
          id: "LOC-003",
          name: "Ambulance Bay",
          type: "room",
          parentId: "LOC-001",
          description: "Vehicle parking and equipment area",
          capacity: 200,
          assignedItems: [],
          children: [
            {
              id: "LOC-004",
              name: "BLS Cabinet",
              type: "cabinet",
              parentId: "LOC-003",
              description: "Basic Life Support supplies",
              capacity: 50,
              assignedItems: ["INV-003"],
              children: [],
            },
            {
              id: "LOC-005",
              name: "ALS Cabinet",
              type: "cabinet",
              parentId: "LOC-003",
              description: "Advanced Life Support supplies",
              capacity: 75,
              assignedItems: ["INV-004", "INV-005"],
              children: [],
            },
          ],
        },
      ],
    },
  ])

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["LOC-001", "LOC-003"]))
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLocation, setNewLocation] = useState({
    name: "",
    type: "room" as Location["type"],
    parentId: "",
    description: "",
    capacity: "",
  })

  // Mock inventory items for assignment
  const availableItems: InventoryItem[] = [
    { id: "INV-001", name: "Oxygen Tank (15L)", category: "Emergency", currentStock: 3 },
    { id: "INV-002", name: "Sterile Bandages (Pack of 50)", category: "Consumables", currentStock: 45 },
    { id: "INV-003", name: "Defibrillator AED", category: "Equipment", currentStock: 8 },
    { id: "INV-004", name: "Morphine 10mg/ml", category: "Medications", currentStock: 12 },
    { id: "INV-005", name: "Disposable Syringes (100 pack)", category: "Consumables", currentStock: 0 },
  ]

  const toggleExpanded = (locationId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId)
    } else {
      newExpanded.add(locationId)
    }
    setExpandedNodes(newExpanded)
  }

  const getLocationIcon = (type: Location["type"]) => {
    switch (type) {
      case "building":
        return <Building2 className="h-4 w-4 text-emerald-600" />
      case "room":
        return <FolderOpen className="h-4 w-4 text-emerald-600" />
      case "cabinet":
        return <Archive className="h-4 w-4 text-emerald-600" />
      case "shelf":
        return <Package className="h-4 w-4 text-emerald-600" />
      case "container":
        return <Package className="h-4 w-4 text-emerald-600" />
      default:
        return <MapPin className="h-4 w-4 text-emerald-600" />
    }
  }

  const getTypeColor = (type: Location["type"]) => {
    switch (type) {
      case "building":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "room":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "cabinet":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "shelf":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "container":
        return "bg-gray-50 text-gray-700 border-gray-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const renderLocationTree = (locations: Location[], depth = 0) => {
    return locations.map((location) => (
      <div key={location.id} className="space-y-1">
        <div
          className={`flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-white cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent ${
            selectedLocation?.id === location.id
              ? "bg-gradient-to-r from-emerald-50 to-white border-emerald-200 shadow-sm"
              : ""
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => setSelectedLocation(location)}
        >
          {location.children && location.children.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-emerald-100 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(location.id)
              }}
            >
              {expandedNodes.has(location.id) ? (
                <ChevronDown className="h-4 w-4 text-emerald-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-emerald-600" />
              )}
            </Button>
          )}
          {(!location.children || location.children.length === 0) && <div className="w-7" />}

          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
            {getLocationIcon(location.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-semibold text-gray-900 truncate">{location.name}</span>
              <Badge variant="secondary" className={`${getTypeColor(location.type)} font-medium`}>
                {location.type}
              </Badge>
              {location.assignedItems.length > 0 && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  {location.assignedItems.length} items
                </Badge>
              )}
            </div>
            {location.description && <p className="text-sm text-gray-600 truncate">{location.description}</p>}
          </div>
        </div>

        {location.children &&
          location.children.length > 0 &&
          expandedNodes.has(location.id) &&
          renderLocationTree(location.children, depth + 1)}
      </div>
    ))
  }

  const handleAddLocation = () => {
    if (!newLocation.name.trim()) return

    const newLoc: Location = {
      id: `LOC-${Date.now()}`,
      name: newLocation.name,
      type: newLocation.type,
      parentId: newLocation.parentId || undefined,
      description: newLocation.description || undefined,
      capacity: newLocation.capacity ? Number.parseInt(newLocation.capacity) : undefined,
      assignedItems: [],
      children: [],
    }

    // Add to locations tree
    const addToTree = (locs: Location[]): Location[] => {
      return locs.map((loc) => {
        if (loc.id === newLocation.parentId) {
          return {
            ...loc,
            children: [...(loc.children || []), newLoc],
          }
        }
        if (loc.children) {
          return {
            ...loc,
            children: addToTree(loc.children),
          }
        }
        return loc
      })
    }

    if (newLocation.parentId) {
      setLocations(addToTree(locations))
    } else {
      setLocations([...locations, newLoc])
    }

    // Reset form
    setNewLocation({
      name: "",
      type: "room",
      parentId: "",
      description: "",
      capacity: "",
    })
    setShowAddForm(false)
  }

  const getAllLocationsFlat = (locs: Location[]): Location[] => {
    let result: Location[] = []
    locs.forEach((loc) => {
      result.push(loc)
      if (loc.children) {
        result = result.concat(getAllLocationsFlat(loc.children))
      }
    })
    return result
  }

  const getItemName = (itemId: string) => {
    const item = availableItems.find((i) => i.id === itemId)
    return item ? item.name : itemId
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white rounded-2xl p-8 shadow-sm border border-emerald-100">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              Location Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Define and manage inventory storage locations</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200">
                    <Building2 className="h-5 w-5 text-emerald-700" />
                  </div>
                  <span className="text-gray-900">Location Hierarchy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">{renderLocationTree(locations)}</CardContent>
            </Card>
          </div>

          {/* Location Details & Add Form */}
          <div className="space-y-8">
            {showAddForm && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
                  <CardTitle className="text-xl text-gray-900">Add New Location</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Location Name
                    </Label>
                    <Input
                      id="name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="Enter location name"
                      className="mt-1 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                      Location Type
                    </Label>
                    <Select
                      value={newLocation.type}
                      onValueChange={(value: Location["type"]) => setNewLocation({ ...newLocation, type: value })}
                    >
                      <SelectTrigger className="mt-1 border-gray-200 focus:border-emerald-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="building">Building</SelectItem>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="cabinet">Cabinet</SelectItem>
                        <SelectItem value="shelf">Shelf</SelectItem>
                        <SelectItem value="container">Container</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="parent" className="text-sm font-semibold text-gray-700">
                      Parent Location
                    </Label>
                    <Select
                      value={newLocation.parentId || "none"}
                      onValueChange={(value) => setNewLocation({ ...newLocation, parentId: value })}
                    >
                      <SelectTrigger className="mt-1 border-gray-200 focus:border-emerald-300">
                        <SelectValue placeholder="Select parent location (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Parent (Root Level)</SelectItem>
                        {getAllLocationsFlat(locations).map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} ({loc.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={newLocation.description}
                      onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                      placeholder="Optional description"
                      className="mt-1 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capacity" className="text-sm font-semibold text-gray-700">
                      Capacity
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newLocation.capacity}
                      onChange={(e) => setNewLocation({ ...newLocation, capacity: e.target.value })}
                      placeholder="Maximum items"
                      className="mt-1 border-gray-200 focus:border-emerald-300 focus:ring-emerald-200"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={handleAddLocation}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Add Location
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedLocation && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200">
                      {getLocationIcon(selectedLocation.type)}
                    </div>
                    <span className="text-gray-900">{selectedLocation.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getTypeColor(selectedLocation.type)} font-medium`}>
                      {selectedLocation.type}
                    </Badge>
                    <span className="text-sm text-gray-500">ID: {selectedLocation.id}</span>
                  </div>

                  {selectedLocation.description && (
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedLocation.description}</p>
                  )}

                  {selectedLocation.capacity && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-gray-700 font-medium">Capacity:</span>
                      <span className="font-semibold text-emerald-700">
                        {selectedLocation.assignedItems.length}/{selectedLocation.capacity} items
                      </span>
                    </div>
                  )}

                  <Separator className="bg-gray-200" />

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Assigned Items ({selectedLocation.assignedItems.length})
                    </h4>
                    {selectedLocation.assignedItems.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLocation.assignedItems.map((itemId) => (
                          <div
                            key={itemId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <span className="text-sm font-medium text-gray-700">{getItemName(itemId)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No items assigned</p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 bg-transparent"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 bg-transparent"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Assign Items
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
