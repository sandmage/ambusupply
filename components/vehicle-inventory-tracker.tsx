"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, ArrowRightLeft, Plus, Minus, History, Search, Filter, AlertCircle, Loader2 } from "lucide-react"

interface Vehicle {
  id: string
  vehicle_number: string
  make: string
  model: string
  year: number
}

interface VehicleInventoryItem {
  id: string
  vehicle_id: string
  inventory_item_id: string
  storage_unit_id?: string
  storage_location_id?: string
  current_quantity: number
  par_level_min: number
  par_level_max?: number
  inventory_item?: {
    name: string
    description?: string
    category?: string
    unit_of_measure: string
  }
  storage_unit?: {
    name: string
    unit_type: string
  }
  storage_location?: {
    name: string
    location_type: string
  }
}

interface VehicleInventoryTransaction {
  id: string
  vehicle_inventory_item_id: string
  transaction_type: string
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reason?: string
  notes?: string
  performed_by: string
  performed_at: string
  vehicle_inventory_item?: VehicleInventoryItem
  profile?: {
    full_name: string
    email: string
  }
}

interface VehicleInventoryTrackerProps {
  vehicles: Vehicle[]
}

export function VehicleInventoryTracker({ vehicles }: VehicleInventoryTrackerProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles.length > 0 ? vehicles[0] : null)
  const [inventoryItems, setInventoryItems] = useState<VehicleInventoryItem[]>([])
  const [transactions, setTransactions] = useState<VehicleInventoryTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionFilter, setTransactionFilter] = useState("all")

  // Transaction dialogs
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<VehicleInventoryItem | null>(null)

  // Transaction form data
  const [transactionData, setTransactionData] = useState({
    transaction_type: "",
    quantity_change: "",
    reason: "",
    notes: "",
  })

  // Transfer form data
  const [transferData, setTransferData] = useState({
    target_vehicle_id: "",
    target_storage_unit_id: "",
    target_storage_location_id: "",
    quantity_to_transfer: "",
    reason: "",
    notes: "",
  })

  const [targetVehicleStorageUnits, setTargetVehicleStorageUnits] = useState<any[]>([])
  const [targetStorageLocations, setTargetStorageLocations] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleData()
    }
  }, [selectedVehicle])

  useEffect(() => {
    if (transferData.target_vehicle_id) {
      fetchTargetVehicleStorageUnits()
    }
  }, [transferData.target_vehicle_id])

  useEffect(() => {
    if (transferData.target_storage_unit_id) {
      fetchTargetStorageLocations()
    }
  }, [transferData.target_storage_unit_id])

  const fetchVehicleData = async () => {
    if (!selectedVehicle) return

    setLoading(true)
    try {
      // Fetch inventory items
      const { data: inventoryData } = await supabase
        .from("vehicle_inventory_items")
        .select(`
          *,
          inventory_item:inventory_items(name, description, category, unit_of_measure),
          storage_unit:vehicle_storage_units(name, unit_type),
          storage_location:vehicle_storage_locations(name, location_type)
        `)
        .eq("vehicle_id", selectedVehicle.id)
        .order("inventory_item(name)")

      // Fetch recent transactions
      const { data: transactionData } = await supabase
        .from("vehicle_inventory_transactions")
        .select(`
          *,
          vehicle_inventory_item:vehicle_inventory_items(
            *,
            inventory_item:inventory_items(name, description, category, unit_of_measure),
            storage_unit:vehicle_storage_units(name, unit_type),
            storage_location:vehicle_storage_locations(name, location_type)
          ),
          profile:profiles(full_name, email)
        `)
        .eq("vehicle_inventory_item.vehicle_id", selectedVehicle.id)
        .order("performed_at", { ascending: false })
        .limit(50)

      setInventoryItems(inventoryData || [])
      setTransactions(transactionData || [])
    } catch (error) {
      console.error("Error fetching vehicle data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTargetVehicleStorageUnits = async () => {
    if (!transferData.target_vehicle_id) return

    try {
      const { data } = await supabase
        .from("vehicle_storage_units")
        .select(`
          *,
          storage_locations:vehicle_storage_locations(*)
        `)
        .eq("vehicle_id", transferData.target_vehicle_id)
        .order("name")

      setTargetVehicleStorageUnits(data || [])
    } catch (error) {
      console.error("Error fetching target vehicle storage units:", error)
    }
  }

  const fetchTargetStorageLocations = async () => {
    const selectedUnit = targetVehicleStorageUnits.find((unit) => unit.id === transferData.target_storage_unit_id)
    setTargetStorageLocations(selectedUnit?.storage_locations || [])
  }

  const handleTransaction = async () => {
    if (!selectedItem || !transactionData.transaction_type || !transactionData.quantity_change) {
      setError("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const quantityChange = Number.parseInt(transactionData.quantity_change)
      const isNegative = ["use", "expired", "transfer"].includes(transactionData.transaction_type)
      const finalQuantityChange = isNegative ? -Math.abs(quantityChange) : Math.abs(quantityChange)
      const newQuantity = selectedItem.current_quantity + finalQuantityChange

      if (newQuantity < 0) {
        setError("Transaction would result in negative quantity")
        return
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from("vehicle_inventory_transactions").insert([
        {
          vehicle_inventory_item_id: selectedItem.id,
          transaction_type: transactionData.transaction_type,
          quantity_change: finalQuantityChange,
          quantity_before: selectedItem.current_quantity,
          quantity_after: newQuantity,
          reason: transactionData.reason || null,
          notes: transactionData.notes || null,
        },
      ])

      if (transactionError) throw transactionError

      // Update inventory item quantity
      const { error: updateError } = await supabase
        .from("vehicle_inventory_items")
        .update({ current_quantity: newQuantity })
        .eq("id", selectedItem.id)

      if (updateError) throw updateError

      // Refresh data and close dialog
      await fetchVehicleData()
      setShowTransactionDialog(false)
      setSelectedItem(null)
      setTransactionData({ transaction_type: "", quantity_change: "", reason: "", notes: "" })
    } catch (error: any) {
      console.error("Error creating transaction:", error)
      setError(error.message || "Failed to create transaction")
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedItem || !transferData.target_vehicle_id || !transferData.quantity_to_transfer) {
      setError("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const quantityToTransfer = Number.parseInt(transferData.quantity_to_transfer)

      if (quantityToTransfer > selectedItem.current_quantity) {
        setError("Cannot transfer more than current quantity")
        return
      }

      // Check if target item already exists
      const { data: existingTargetItem } = await supabase
        .from("vehicle_inventory_items")
        .select("*")
        .eq("vehicle_id", transferData.target_vehicle_id)
        .eq("inventory_item_id", selectedItem.inventory_item_id)
        .eq("storage_unit_id", transferData.target_storage_unit_id || null)
        .eq("storage_location_id", transferData.target_storage_location_id || null)
        .single()

      if (existingTargetItem) {
        // Update existing target item
        const { error: updateTargetError } = await supabase
          .from("vehicle_inventory_items")
          .update({ current_quantity: existingTargetItem.current_quantity + quantityToTransfer })
          .eq("id", existingTargetItem.id)

        if (updateTargetError) throw updateTargetError

        // Create transaction for target
        const { error: targetTransactionError } = await supabase.from("vehicle_inventory_transactions").insert([
          {
            vehicle_inventory_item_id: existingTargetItem.id,
            transaction_type: "transfer",
            quantity_change: quantityToTransfer,
            quantity_before: existingTargetItem.current_quantity,
            quantity_after: existingTargetItem.current_quantity + quantityToTransfer,
            reason: transferData.reason || null,
            notes: `Transferred from ${selectedVehicle?.vehicle_number}. ${transferData.notes || ""}`.trim(),
          },
        ])

        if (targetTransactionError) throw targetTransactionError
      } else {
        // Create new target item
        const { data: newTargetItem, error: createTargetError } = await supabase
          .from("vehicle_inventory_items")
          .insert([
            {
              vehicle_id: transferData.target_vehicle_id,
              inventory_item_id: selectedItem.inventory_item_id,
              storage_unit_id: transferData.target_storage_unit_id || null,
              storage_location_id: transferData.target_storage_location_id || null,
              current_quantity: quantityToTransfer,
              par_level_min: selectedItem.par_level_min,
              par_level_max: selectedItem.par_level_max,
            },
          ])
          .select()
          .single()

        if (createTargetError) throw createTargetError

        // Create transaction for new target item
        const { error: targetTransactionError } = await supabase.from("vehicle_inventory_transactions").insert([
          {
            vehicle_inventory_item_id: newTargetItem.id,
            transaction_type: "transfer",
            quantity_change: quantityToTransfer,
            quantity_before: 0,
            quantity_after: quantityToTransfer,
            reason: transferData.reason || null,
            notes: `Transferred from ${selectedVehicle?.vehicle_number}. ${transferData.notes || ""}`.trim(),
          },
        ])

        if (targetTransactionError) throw targetTransactionError
      }

      // Update source item quantity
      const newSourceQuantity = selectedItem.current_quantity - quantityToTransfer
      const { error: updateSourceError } = await supabase
        .from("vehicle_inventory_items")
        .update({ current_quantity: newSourceQuantity })
        .eq("id", selectedItem.id)

      if (updateSourceError) throw updateSourceError

      // Create transaction for source
      const targetVehicle = vehicles.find((v) => v.id === transferData.target_vehicle_id)
      const { error: sourceTransactionError } = await supabase.from("vehicle_inventory_transactions").insert([
        {
          vehicle_inventory_item_id: selectedItem.id,
          transaction_type: "transfer",
          quantity_change: -quantityToTransfer,
          quantity_before: selectedItem.current_quantity,
          quantity_after: newSourceQuantity,
          reason: transferData.reason || null,
          notes: `Transferred to ${targetVehicle?.vehicle_number}. ${transferData.notes || ""}`.trim(),
        },
      ])

      if (sourceTransactionError) throw sourceTransactionError

      // Refresh data and close dialog
      await fetchVehicleData()
      setShowTransferDialog(false)
      setSelectedItem(null)
      setTransferData({
        target_vehicle_id: "",
        target_storage_unit_id: "",
        target_storage_location_id: "",
        quantity_to_transfer: "",
        reason: "",
        notes: "",
      })
    } catch (error: any) {
      console.error("Error transferring inventory:", error)
      setError(error.message || "Failed to transfer inventory")
    } finally {
      setSubmitting(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "restock":
        return <Plus className="h-3 w-3 text-secondary" />
      case "use":
        return <Minus className="h-3 w-3 text-destructive" />
      case "transfer":
        return <ArrowRightLeft className="h-3 w-3 text-accent" />
      case "adjustment":
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />
      case "expired":
        return <AlertCircle className="h-3 w-3 text-destructive" />
      default:
        return <History className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getTransactionBadge = (type: string) => {
    const variants = {
      restock: "secondary",
      use: "destructive",
      transfer: "default",
      adjustment: "outline",
      expired: "destructive",
      check: "outline",
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"} className="rounded-lg">
        <span className="flex items-center gap-1">
          {getTransactionIcon(type)}
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </Badge>
    )
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.vehicle_inventory_item?.inventory_item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = transactionFilter === "all" || transaction.transaction_type === transactionFilter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Vehicle Selection */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inventory Tracking & Transactions
          </CardTitle>
          <CardDescription>Track inventory movements, usage, and transfers between vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedVehicle?.id || ""}
            onValueChange={(value) => {
              const vehicle = vehicles.find((v) => v.id === value)
              setSelectedVehicle(vehicle || null)
            }}
          >
            <SelectTrigger className="w-64 rounded-2xl">
              <SelectValue placeholder="Select vehicle..." />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number} - {vehicle.year} {vehicle.make} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <div className="space-y-6">
          {/* Current Inventory Items */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>Manage transactions for inventory items in this vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.inventory_item?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.storage_unit?.name}
                            {item.storage_location && ` → ${item.storage_location.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {item.current_quantity} {item.inventory_item?.unit_of_measure}
                          </p>
                          <p className="text-sm text-muted-foreground">Par: {item.par_level_min}+</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowTransactionDialog(true)
                            }}
                            className="rounded-xl bg-transparent"
                          >
                            <History className="h-3 w-3 mr-1" />
                            Transaction
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowTransferDialog(true)
                            }}
                            className="rounded-xl bg-transparent"
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            Transfer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="apple-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Recent inventory movements and changes</CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 rounded-2xl"
                    />
                  </div>
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger className="w-48 rounded-2xl">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="restock">Restock</SelectItem>
                      <SelectItem value="use">Use</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Before/After</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{new Date(transaction.performed_at).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.performed_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.vehicle_inventory_item?.inventory_item?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.vehicle_inventory_item?.storage_unit?.name}
                            {transaction.vehicle_inventory_item?.storage_location &&
                              ` → ${transaction.vehicle_inventory_item.storage_location.name}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getTransactionBadge(transaction.transaction_type)}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${transaction.quantity_change >= 0 ? "text-secondary" : "text-destructive"}`}
                        >
                          {transaction.quantity_change >= 0 ? "+" : ""}
                          {transaction.quantity_change}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.quantity_before} → {transaction.quantity_after}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.profile?.full_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{transaction.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {transaction.reason && <p className="font-medium">{transaction.reason}</p>}
                          {transaction.notes && <p className="text-sm text-muted-foreground">{transaction.notes}</p>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
            <DialogDescription>
              Record inventory usage, restocking, or adjustments for {selectedItem?.inventory_item?.name}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Transaction Type *</Label>
              <Select
                value={transactionData.transaction_type}
                onValueChange={(value) => setTransactionData({ ...transactionData, transaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="use">Use</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="check">Check/Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_change">Quantity *</Label>
              <Input
                id="quantity_change"
                type="number"
                value={transactionData.quantity_change}
                onChange={(e) => setTransactionData({ ...transactionData, quantity_change: e.target.value })}
                placeholder="Enter quantity"
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                Current quantity: {selectedItem?.current_quantity} {selectedItem?.inventory_item?.unit_of_measure}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={transactionData.reason}
                onChange={(e) => setTransactionData({ ...transactionData, reason: e.target.value })}
                placeholder="Brief reason for transaction"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={transactionData.notes}
                onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                placeholder="Additional notes or details"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleTransaction} disabled={submitting} className="apple-button">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Inventory</DialogTitle>
            <DialogDescription>
              Transfer {selectedItem?.inventory_item?.name} to another vehicle or location
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_vehicle_id">Target Vehicle *</Label>
                <Select
                  value={transferData.target_vehicle_id}
                  onValueChange={(value) =>
                    setTransferData({
                      ...transferData,
                      target_vehicle_id: value,
                      target_storage_unit_id: "",
                      target_storage_location_id: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles
                      .filter((v) => v.id !== selectedVehicle?.id)
                      .map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} - {vehicle.year} {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_to_transfer">Quantity to Transfer *</Label>
                <Input
                  id="quantity_to_transfer"
                  type="number"
                  value={transferData.quantity_to_transfer}
                  onChange={(e) => setTransferData({ ...transferData, quantity_to_transfer: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  max={selectedItem?.current_quantity}
                />
                <p className="text-sm text-muted-foreground">
                  Available: {selectedItem?.current_quantity} {selectedItem?.inventory_item?.unit_of_measure}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_storage_unit_id">Target Storage Unit</Label>
                <Select
                  value={transferData.target_storage_unit_id}
                  onValueChange={(value) =>
                    setTransferData({ ...transferData, target_storage_unit_id: value, target_storage_location_id: "" })
                  }
                  disabled={!transferData.target_vehicle_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetVehicleStorageUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.unit_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_storage_location_id">Target Location (Optional)</Label>
                <Select
                  value={transferData.target_storage_location_id}
                  onValueChange={(value) => setTransferData({ ...transferData, target_storage_location_id: value })}
                  disabled={!transferData.target_storage_unit_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific location" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetStorageLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.location_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer_reason">Reason</Label>
              <Input
                id="transfer_reason"
                value={transferData.reason}
                onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                placeholder="Reason for transfer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer_notes">Notes</Label>
              <Textarea
                id="transfer_notes"
                value={transferData.notes}
                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                placeholder="Additional transfer notes"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowTransferDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={submitting} className="apple-button">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Inventory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
