"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Wrench, CheckCircle, XCircle, Edit, Eye, Calendar, Truck, MapPin, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EquipmentForm } from "@/components/equipment-form"
import { EquipmentMaintenanceForm } from "@/components/equipment-maintenance-form"
import { EquipmentAssignmentForm } from "@/components/equipment-assignment-form"

interface Equipment {
  id: string
  serial_number: string
  asset_tag?: string
  status: "in_service" | "out_of_service" | "maintenance" | "retired" | "assigned"
  purchase_date?: string
  warranty_expiration?: string
  last_maintenance_date?: string
  next_maintenance_due?: string
  notes?: string
  equipment_types: {
    id: string
    name: string
    category: string
    manufacturer?: string
    model?: string
  }
  locations?: {
    id: string
    name: string
  }
  vehicles?: {
    id: string
    vehicle_number: string
    make: string
    model: string
  }
}

interface EquipmentType {
  id: string
  name: string
  category: string
  manufacturer?: string
  model?: string
}

interface Location {
  id: string
  name: string
}

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
}

interface EquipmentClientProps {
  equipment: Equipment[]
  equipmentTypes: EquipmentType[]
  locations: Location[]
  vehicles: Vehicle[]
  userRole: "admin" | "staff"
  stats: {
    total: number
    inService: number
    maintenance: number
    outOfService: number
  }
}

export function EquipmentClient({
  equipment,
  equipmentTypes,
  locations,
  vehicles,
  userRole,
  stats,
}: EquipmentClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("equipment")
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null)
  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] = useState<string>("")
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([])
  const [maintenanceFilter, setMaintenanceFilter] = useState<string>("all")
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [selectedEquipmentForAssignment, setSelectedEquipmentForAssignment] = useState<string>("")
  const [assignments, setAssignments] = useState<any[]>([])
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all")

  useEffect(() => {
    if (activeTab === "maintenance") {
      fetchMaintenanceRecords()
    } else if (activeTab === "assignments") {
      fetchAssignments()
    }
  }, [activeTab])

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await fetch("/api/equipment-maintenance")
      if (response.ok) {
        const data = await response.json()
        setMaintenanceRecords(data.maintenanceRecords || [])
      }
    } catch (error) {
      console.error("Error fetching maintenance records:", error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/equipment-assignments")
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  const handleSaveEquipment = async (equipmentData: any) => {
    try {
      const method = editingEquipment ? "PUT" : "POST"
      const response = await fetch("/api/equipment", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(equipmentData),
      })

      if (!response.ok) {
        throw new Error("Failed to save equipment")
      }

      router.refresh()
      setEditingEquipment(null)
    } catch (error) {
      console.error("Error saving equipment:", error)
      throw error
    }
  }

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setIsEquipmentFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsEquipmentFormOpen(false)
    setEditingEquipment(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_service":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
            In Service
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            Maintenance
          </Badge>
        )
      case "out_of_service":
        return <Badge variant="destructive">Out of Service</Badge>
      case "assigned":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Assigned
          </Badge>
        )
      case "retired":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Retired
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSaveMaintenance = async (maintenanceData: any) => {
    try {
      const method = editingMaintenance ? "PUT" : "POST"
      const response = await fetch("/api/equipment-maintenance", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(maintenanceData),
      })

      if (!response.ok) {
        throw new Error("Failed to save maintenance record")
      }

      await fetchMaintenanceRecords()
      router.refresh()
      setEditingMaintenance(null)
      setSelectedEquipmentForMaintenance("")
    } catch (error) {
      console.error("Error saving maintenance record:", error)
      throw error
    }
  }

  const handleScheduleMaintenance = (equipmentId: string) => {
    setSelectedEquipmentForMaintenance(equipmentId)
    setIsMaintenanceFormOpen(true)
  }

  const handleEditMaintenance = (maintenance: any) => {
    setEditingMaintenance(maintenance)
    setIsMaintenanceFormOpen(true)
  }

  const handleCloseMaintenanceForm = () => {
    setIsMaintenanceFormOpen(false)
    setEditingMaintenance(null)
    setSelectedEquipmentForMaintenance("")
  }

  const handleSaveAssignment = async (assignmentData: any) => {
    try {
      const method = editingAssignment ? "PUT" : "POST"
      const response = await fetch("/api/equipment-assignments", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      })

      if (!response.ok) {
        throw new Error("Failed to save assignment")
      }

      await fetchAssignments()
      router.refresh()
      setEditingAssignment(null)
      setSelectedEquipmentForAssignment("")
    } catch (error) {
      console.error("Error saving assignment:", error)
      throw error
    }
  }

  const handleAssignEquipment = (equipmentId: string) => {
    setSelectedEquipmentForAssignment(equipmentId)
    setIsAssignmentFormOpen(true)
  }

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment)
    setIsAssignmentFormOpen(true)
  }

  const handleUnassignEquipment = async (assignmentId: string, equipmentId: string) => {
    try {
      const response = await fetch(`/api/equipment-assignments?id=${assignmentId}&equipment_id=${equipmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to unassign equipment")
      }

      await fetchAssignments()
      router.refresh()
    } catch (error) {
      console.error("Error unassigning equipment:", error)
    }
  }

  const handleCloseAssignmentForm = () => {
    setIsAssignmentFormOpen(false)
    setEditingAssignment(null)
    setSelectedEquipmentForAssignment("")
  }

  const categories = [...new Set(equipmentTypes.map((type) => type.category))]

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.equipment_types.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.asset_tag && item.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesCategory = categoryFilter === "all" || item.equipment_types.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const filteredMaintenanceRecords = maintenanceRecords.filter((record) => {
    if (maintenanceFilter === "all") return true
    if (maintenanceFilter === "scheduled") return record.scheduled_date && !record.completed_date
    if (maintenanceFilter === "completed") return record.completed_date
    if (maintenanceFilter === "overdue") {
      return record.scheduled_date && !record.completed_date && new Date(record.scheduled_date) < new Date()
    }
    return true
  })

  const filteredAssignments = assignments.filter((assignment) => {
    if (assignmentFilter === "all") return true
    if (assignmentFilter === "vehicle") return assignment.vehicle_id
    if (assignmentFilter === "location") return assignment.location_id
    return true
  })

  const getMaintenanceStatusBadge = (record: any) => {
    if (record.completed_date) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Completed
        </Badge>
      )
    }
    if (record.scheduled_date) {
      const isOverdue = new Date(record.scheduled_date) < new Date()
      return isOverdue ? (
        <Badge variant="destructive">Overdue</Badge>
      ) : (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Scheduled
        </Badge>
      )
    }
    return <Badge variant="outline">Unscheduled</Badge>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary">Equipment Management</h1>
          <p className="text-lg text-muted-foreground">Manage medical equipment, maintenance, and assignments</p>
        </div>
        {userRole === "admin" && (
          <div className="flex gap-2">
            {activeTab === "maintenance" && (
              <Button onClick={() => setIsMaintenanceFormOpen(true)} className="apple-button-secondary">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            )}
            {activeTab === "assignments" && (
              <Button onClick={() => setIsAssignmentFormOpen(true)} className="apple-button-secondary">
                <UserCheck className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
            {activeTab === "equipment" && (
              <Button onClick={() => setIsEquipmentFormOpen(true)} className="apple-button">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All equipment items</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Service</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inService}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Service</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfService}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          {/* Search and Filters */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>View and manage all medical equipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search equipment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_service">In Service</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Equipment Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location/Assignment</TableHead>
                      <TableHead>Next Maintenance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No equipment found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEquipment.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.equipment_types.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.equipment_types.manufacturer} {item.equipment_types.model}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.serial_number}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.vehicles ? (
                              <div className="text-sm">
                                <div className="font-medium">Vehicle {item.vehicles.vehicle_number}</div>
                                <div className="text-muted-foreground">
                                  {item.vehicles.make} {item.vehicles.model}
                                </div>
                              </div>
                            ) : item.locations ? (
                              <div className="text-sm">{item.locations.name}</div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.next_maintenance_due ? (
                              <div className="text-sm">{new Date(item.next_maintenance_due).toLocaleDateString()}</div>
                            ) : (
                              <span className="text-muted-foreground">Not scheduled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {userRole === "admin" && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleScheduleMaintenance(item.id)}
                                  >
                                    <Wrench className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleAssignEquipment(item.id)}>
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Track and manage equipment maintenance records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search maintenance records..." className="pl-10" />
                  </div>
                </div>
                <Select value={maintenanceFilter} onValueChange={setMaintenanceFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No maintenance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaintenanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.equipment?.equipment_types?.name}</div>
                              <div className="text-sm text-muted-foreground">{record.equipment?.serial_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {record.maintenance_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                          <TableCell>
                            {record.scheduled_date ? (
                              <div className="text-sm">{new Date(record.scheduled_date).toLocaleDateString()}</div>
                            ) : (
                              <span className="text-muted-foreground">Not scheduled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.completed_date ? (
                              <div className="text-sm">{new Date(record.completed_date).toLocaleDateString()}</div>
                            ) : (
                              <span className="text-muted-foreground">Not completed</span>
                            )}
                          </TableCell>
                          <TableCell>{getMaintenanceStatusBadge(record)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {userRole === "admin" && (
                                <Button variant="outline" size="sm" onClick={() => handleEditMaintenance(record)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Equipment Assignments</CardTitle>
              <CardDescription>Manage equipment assignments to vehicles and locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search assignments..." className="pl-10" />
                  </div>
                </div>
                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="vehicle">Vehicle Assignments</SelectItem>
                    <SelectItem value="location">Location Assignments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Assignment Type</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assignment.equipment?.equipment_types?.name}</div>
                              <div className="text-sm text-muted-foreground">{assignment.equipment?.serial_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {assignment.vehicle_id ? (
                                <>
                                  <Truck className="h-4 w-4 text-blue-600" />
                                  <span>Vehicle</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4 text-green-600" />
                                  <span>Location</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignment.vehicles ? (
                              <div className="text-sm">
                                <div className="font-medium">Vehicle {assignment.vehicles.vehicle_number}</div>
                                <div className="text-muted-foreground">
                                  {assignment.vehicles.make} {assignment.vehicles.model}
                                </div>
                              </div>
                            ) : assignment.locations ? (
                              <div className="text-sm font-medium">{assignment.locations.name}</div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(assignment.assigned_at).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {assignment.profiles?.full_name || assignment.profiles?.email}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {assignment.assignment_notes || <span className="text-muted-foreground">No notes</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {userRole === "admin" && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => handleEditAssignment(assignment)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnassignEquipment(assignment.id, assignment.equipment_id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Equipment Reports</CardTitle>
              <CardDescription>Generate reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">Reports coming soon...</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equipment Form Dialog */}
      <EquipmentForm
        isOpen={isEquipmentFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveEquipment}
        equipmentTypes={equipmentTypes}
        locations={locations}
        vehicles={vehicles}
        editingEquipment={editingEquipment}
      />

      {/* Maintenance Form Dialog */}
      <EquipmentMaintenanceForm
        isOpen={isMaintenanceFormOpen}
        onClose={handleCloseMaintenanceForm}
        onSave={handleSaveMaintenance}
        equipment={equipment}
        selectedEquipmentId={selectedEquipmentForMaintenance}
        editingMaintenance={editingMaintenance}
      />

      {/* Assignment Form Dialog */}
      <EquipmentAssignmentForm
        isOpen={isAssignmentFormOpen}
        onClose={handleCloseAssignmentForm}
        onSave={handleSaveAssignment}
        equipment={equipment}
        locations={locations}
        vehicles={vehicles}
        selectedEquipmentId={selectedEquipmentForAssignment}
        editingAssignment={editingAssignment}
      />
    </div>
  )
}
