"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Car,
  Package,
  ShoppingCart,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
  status: string
}

interface ComplianceItem {
  id: string
  vehicle_id: string
  vehicle_number: string
  inventory_item_id: string
  inventory_item_name: string
  inventory_item_category: string
  unit_of_measure: string
  storage_unit_name: string
  storage_location_name?: string
  current_quantity: number
  par_level_min: number
  par_level_max?: number
  compliance_status: "compliant" | "below_par" | "critical" | "expired"
  days_until_expiration?: number
  expiration_date?: string
  last_restocked?: string
}

interface RestockingRequest {
  id?: string
  vehicle_id: string
  inventory_item_id: string
  requested_quantity: number
  priority: "low" | "medium" | "high" | "critical"
  reason: string
  notes?: string
  status: "pending" | "approved" | "ordered" | "received" | "cancelled"
  requested_by: string
  requested_at: string
}

export function ComplianceMonitoringDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([])
  const [restockingRequests, setRestockingRequests] = useState<RestockingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [complianceFilter, setComplianceFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [showRestockDialog, setShowRestockDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null)
  const [restockData, setRestockData] = useState({
    requested_quantity: "",
    priority: "medium",
    reason: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    setLoading(true)
    try {
      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("id, vehicle_number, make, model, year, status")
        .eq("status", "active")
        .order("vehicle_number")

      // Fetch compliance data with complex query
      const { data: complianceData } = await supabase
        .from("vehicle_inventory_items")
        .select(`
          id,
          vehicle_id,
          current_quantity,
          par_level_min,
          par_level_max,
          expiration_date,
          vehicles!inner(vehicle_number),
          inventory_item:inventory_items(id, name, category, unit_of_measure),
          storage_unit:vehicle_storage_units(name),
          storage_location:vehicle_storage_locations(name)
        `)
        .eq("vehicles.status", "active")

      // Fetch recent restocking requests
      const { data: restockingData } = await supabase
        .from("restocking_requests")
        .select(`
          *,
          vehicle:vehicles(vehicle_number),
          inventory_item:inventory_items(name, category)
        `)
        .order("requested_at", { ascending: false })
        .limit(50)

      // Process compliance data
      const processedCompliance =
        complianceData?.map((item) => {
          let complianceStatus: ComplianceItem["compliance_status"] = "compliant"
          let daysUntilExpiration: number | undefined

          // Check par level compliance
          if (item.current_quantity === 0) {
            complianceStatus = "critical"
          } else if (item.current_quantity < item.par_level_min) {
            complianceStatus = "below_par"
          }

          // Check expiration
          if (item.expiration_date) {
            const expirationDate = new Date(item.expiration_date)
            const today = new Date()
            const diffTime = expirationDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            daysUntilExpiration = diffDays

            if (diffDays <= 0) {
              complianceStatus = "expired"
            } else if (diffDays <= 30 && complianceStatus === "compliant") {
              complianceStatus = "below_par"
            }
          }

          return {
            id: item.id,
            vehicle_id: item.vehicle_id,
            vehicle_number: Array.isArray(item.vehicles)
              ? item.vehicles[0]?.vehicle_number
              : item.vehicles?.vehicle_number,
            inventory_item_id: item.inventory_item.id,
            inventory_item_name: item.inventory_item.name,
            inventory_item_category: item.inventory_item.category || "Uncategorized",
            unit_of_measure: item.inventory_item.unit_of_measure,
            storage_unit_name: item.storage_unit?.name || "Unknown",
            storage_location_name: item.storage_location?.name,
            current_quantity: item.current_quantity,
            par_level_min: item.par_level_min,
            par_level_max: item.par_level_max,
            compliance_status: complianceStatus,
            days_until_expiration: daysUntilExpiration,
            expiration_date: item.expiration_date,
          } as ComplianceItem
        }) || []

      setVehicles(vehiclesData || [])
      setComplianceItems(processedCompliance)
      setRestockingRequests(restockingData || [])
    } catch (error) {
      console.error("Error fetching compliance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestockRequest = async () => {
    if (!selectedItem || !restockData.requested_quantity || !restockData.reason) {
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("restocking_requests").insert([
        {
          vehicle_id: selectedItem.vehicle_id,
          inventory_item_id: selectedItem.inventory_item_id,
          requested_quantity: Number.parseInt(restockData.requested_quantity),
          priority: restockData.priority,
          reason: restockData.reason,
          notes: restockData.notes || null,
          status: "pending",
        },
      ])

      if (error) throw error

      // Refresh data
      await fetchComplianceData()
      setShowRestockDialog(false)
      setSelectedItem(null)
      setRestockData({ requested_quantity: "", priority: "medium", reason: "", notes: "" })
    } catch (error) {
      console.error("Error creating restock request:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getComplianceIcon = (status: ComplianceItem["compliance_status"]) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-secondary" />
      case "below_par":
        return <AlertTriangle className="h-4 w-4 text-accent" />
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "expired":
        return <Clock className="h-4 w-4 text-destructive" />
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getComplianceBadge = (status: ComplianceItem["compliance_status"]) => {
    const variants = {
      compliant: "secondary",
      below_par: "default",
      critical: "destructive",
      expired: "destructive",
    } as const

    const labels = {
      compliant: "Compliant",
      below_par: "Below Par",
      critical: "Critical",
      expired: "Expired",
    }

    return (
      <Badge variant={variants[status]} className="rounded-lg">
        <span className="flex items-center gap-1">
          {getComplianceIcon(status)}
          {labels[status]}
        </span>
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "outline",
      medium: "default",
      high: "default",
      critical: "destructive",
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || "outline"} className="rounded-lg">
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      approved: "secondary",
      ordered: "default",
      received: "secondary",
      cancelled: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="rounded-lg">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredItems = complianceItems.filter((item) => {
    const matchesSearch =
      item.inventory_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inventory_item_category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCompliance = complianceFilter === "all" || item.compliance_status === complianceFilter
    const matchesVehicle = vehicleFilter === "all" || item.vehicle_id === vehicleFilter

    return matchesSearch && matchesCompliance && matchesVehicle
  })

  const complianceStats = {
    total: complianceItems.length,
    compliant: complianceItems.filter((item) => item.compliance_status === "compliant").length,
    belowPar: complianceItems.filter((item) => item.compliance_status === "below_par").length,
    critical: complianceItems.filter((item) => item.compliance_status === "critical").length,
    expired: complianceItems.filter((item) => item.compliance_status === "expired").length,
  }

  const compliancePercentage = complianceStats.total > 0 ? (complianceStats.compliant / complianceStats.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Compliance Monitoring</h2>
          <p className="text-muted-foreground">Monitor inventory compliance and manage restocking workflows</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchComplianceData}
            disabled={loading}
            className="rounded-xl bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="apple-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Compliance</p>
                <p className="text-2xl font-bold">{compliancePercentage.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-4 w-4 text-secondary" />
            </div>
            <Progress value={compliancePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold text-secondary">{complianceStats.compliant}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Below Par</p>
                <p className="text-2xl font-bold text-accent">{complianceStats.belowPar}</p>
              </div>
              <TrendingDown className="h-4 w-4 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">{complianceStats.critical}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive">{complianceStats.expired}</p>
              </div>
              <Clock className="h-4 w-4 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items, vehicles, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-2xl">
            <Car className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicle_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-2xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="below_par">Below Par</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compliance Items Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card className="apple-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current/Par</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.vehicle_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.inventory_item_name}</p>
                        <p className="text-sm text-muted-foreground">{item.inventory_item_category}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.storage_unit_name}</p>
                        {item.storage_location_name && (
                          <p className="text-sm text-muted-foreground">{item.storage_location_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {item.current_quantity} / {item.par_level_min}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.unit_of_measure}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getComplianceBadge(item.compliance_status)}</TableCell>
                    <TableCell>
                      {item.expiration_date ? (
                        <div>
                          <p className="font-medium">{new Date(item.expiration_date).toLocaleDateString()}</p>
                          {item.days_until_expiration !== undefined && (
                            <p
                              className={`text-sm ${
                                item.days_until_expiration <= 30 ? "text-destructive" : "text-muted-foreground"
                              }`}
                            >
                              {item.days_until_expiration <= 0 ? "Expired" : `${item.days_until_expiration} days`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.compliance_status !== "compliant" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowRestockDialog(true)
                          }}
                          className="rounded-xl bg-transparent"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Restock
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Restocking Requests */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle>Recent Restocking Requests</CardTitle>
          <CardDescription>Track the status of recent restocking requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {restockingRequests.slice(0, 10).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{request.inventory_item?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.vehicle?.vehicle_number} • {request.requested_quantity} units • {request.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Restock Request Dialog */}
      <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Restocking</DialogTitle>
            <DialogDescription>
              Create a restocking request for {selectedItem?.inventory_item_name} in {selectedItem?.vehicle_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm">
                <strong>Current:</strong> {selectedItem?.current_quantity} {selectedItem?.unit_of_measure}
              </p>
              <p className="text-sm">
                <strong>Par Level:</strong> {selectedItem?.par_level_min}+ {selectedItem?.unit_of_measure}
              </p>
              <p className="text-sm">
                <strong>Needed:</strong>{" "}
                {selectedItem ? Math.max(0, selectedItem.par_level_min - selectedItem.current_quantity) : 0}{" "}
                {selectedItem?.unit_of_measure}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Requested Quantity *</label>
                <Input
                  type="number"
                  value={restockData.requested_quantity}
                  onChange={(e) => setRestockData({ ...restockData, requested_quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority *</label>
                <Select
                  value={restockData.priority}
                  onValueChange={(value) => setRestockData({ ...restockData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason *</label>
              <Input
                value={restockData.reason}
                onChange={(e) => setRestockData({ ...restockData, reason: e.target.value })}
                placeholder="Brief reason for restocking"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={restockData.notes}
                onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                placeholder="Additional notes or special instructions"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowRestockDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRestockRequest} disabled={submitting} className="apple-button">
              {submitting ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
