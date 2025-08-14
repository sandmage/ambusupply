"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Eye, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export function InventoryTable() {
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({})

  const inventoryItems = [
    {
      id: "INV-001",
      name: "Oxygen Tank (15L)",
      category: "Emergency",
      currentStock: 3,
      minStock: 10,
      maxStock: 50,
      unitPrice: 125.0,
      supplier: "MedSupply Co.",
      lastUpdated: "2024-01-15",
      status: "critical",
    },
    {
      id: "INV-002",
      name: "Sterile Bandages (Pack of 50)",
      category: "Consumables",
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      unitPrice: 15.99,
      supplier: "HealthCare Plus",
      lastUpdated: "2024-01-14",
      status: "in-stock",
    },
    {
      id: "INV-003",
      name: "Defibrillator AED",
      category: "Equipment",
      currentStock: 8,
      minStock: 5,
      maxStock: 15,
      unitPrice: 1250.0,
      supplier: "CardioTech",
      lastUpdated: "2024-01-13",
      status: "in-stock",
    },
    {
      id: "INV-004",
      name: "Morphine 10mg/ml",
      category: "Medications",
      currentStock: 12,
      minStock: 15,
      maxStock: 30,
      unitPrice: 45.5,
      supplier: "PharmaCorp",
      lastUpdated: "2024-01-12",
      status: "low-stock",
    },
    {
      id: "INV-005",
      name: "Disposable Syringes (100 pack)",
      category: "Consumables",
      currentStock: 0,
      minStock: 25,
      maxStock: 100,
      unitPrice: 22.99,
      supplier: "MedSupply Co.",
      lastUpdated: "2024-01-10",
      status: "out-of-stock",
    },
  ]

  const getStatusBadge = (status: string, currentStock: number, minStock: number) => {
    if (status === "critical" || currentStock === 0) {
      return <Badge variant="destructive">Critical</Badge>
    }
    if (status === "low-stock" || currentStock < minStock) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        In Stock
      </Badge>
    )
  }

  const getStockIndicator = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100
    let color = "bg-green-500"

    if (current === 0) color = "bg-red-500"
    else if (current < min) color = "bg-orange-500"
    else if (percentage < 30) color = "bg-yellow-500"

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    )
  }

  const handleView = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setViewModalOpen(true)
    }
  }

  const handleEdit = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setEditFormData({ ...item })
      setEditModalOpen(true)
    }
  }

  const handleDelete = (itemId: string) => {
    const item = inventoryItems.find((i) => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setDeleteModalOpen(true)
    }
  }

  const handleSaveEdit = () => {
    toast.success(`Updated ${editFormData.name}`, {
      description: "Inventory item has been updated successfully.",
    })
    setEditModalOpen(false)
    setSelectedItem(null)
    setEditFormData({})
  }

  const handleConfirmDelete = () => {
    toast.success(`Deleted ${selectedItem?.name}`, {
      description: "Inventory item has been removed from the system.",
    })
    setDeleteModalOpen(false)
    setSelectedItem(null)
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {item.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2 min-w-[120px]">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {item.currentStock}/{item.maxStock}
                        </span>
                        {item.currentStock < item.minStock && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      </div>
                      {getStockIndicator(item.currentStock, item.minStock, item.maxStock)}
                      <div className="text-xs text-muted-foreground">Min: {item.minStock}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status, item.currentStock, item.minStock)}</TableCell>
                  <TableCell className="font-medium">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.supplier}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Inventory Item</DialogTitle>
            <DialogDescription>Detailed information for {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Item ID</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Stock</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.currentStock} units</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Minimum Stock</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.minStock} units</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Maximum Stock</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.maxStock} units</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit Price</Label>
                <p className="text-sm text-muted-foreground">${selectedItem.unitPrice.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Supplier</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.supplier}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div>{getStatusBadge(selectedItem.status, selectedItem.currentStock, selectedItem.minStock)}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">{selectedItem.lastUpdated}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update the details for {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={editFormData.category || ""}
                onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Consumables">Consumables</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Medications">Medications</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                value={editFormData.currentStock || ""}
                onChange={(e) => setEditFormData({ ...editFormData, currentStock: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={editFormData.minStock || ""}
                onChange={(e) => setEditFormData({ ...editFormData, minStock: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                value={editFormData.maxStock || ""}
                onChange={(e) => setEditFormData({ ...editFormData, maxStock: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={editFormData.unitPrice || ""}
                onChange={(e) => setEditFormData({ ...editFormData, unitPrice: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={editFormData.supplier || ""}
                onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
