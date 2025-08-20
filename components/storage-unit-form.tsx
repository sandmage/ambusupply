"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface StorageUnit {
  id?: string
  name: string
  type: string
  description?: string
  position_order?: number
}

interface StorageUnitFormProps {
  unit?: StorageUnit
  isOpen: boolean
  onClose: () => void
  onSave: (unit: Omit<StorageUnit, "id">) => Promise<void>
  parentUnitName?: string
}

const STORAGE_TYPES = [
  { value: "rack", label: "Rack" },
  { value: "shelf", label: "Shelf" },
  { value: "cabinet", label: "Cabinet" },
  { value: "drawer", label: "Drawer" },
  { value: "container", label: "Container/Tote" },
  { value: "bin", label: "Bin" },
  { value: "compartment", label: "Compartment" },
]

export function StorageUnitForm({ unit, isOpen, onClose, onSave, parentUnitName }: StorageUnitFormProps) {
  const [name, setName] = useState(unit?.name || "")
  const [type, setType] = useState(unit?.type || "")
  const [description, setDescription] = useState(unit?.description || "")
  const [positionOrder, setPositionOrder] = useState(unit?.position_order?.toString() || "0")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        position_order: Number.parseInt(positionOrder) || 0,
      })
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error saving storage unit:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName(unit?.name || "")
    setType(unit?.type || "")
    setDescription(unit?.description || "")
    setPositionOrder(unit?.position_order?.toString() || "0")
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{unit ? "Edit Storage Unit" : "Add Storage Unit"}</DialogTitle>
          <DialogDescription>
            {parentUnitName
              ? `Add a storage unit inside "${parentUnitName}"`
              : unit
                ? "Update the storage unit details."
                : "Create a new storage unit in this location."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Unit Name</Label>
              <Input
                id="name"
                placeholder="e.g., Shelf A, Drawer 1, Blue Tote"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select storage type" />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_TYPES.map((storageType) => (
                    <SelectItem key={storageType.value} value={storageType.value}>
                      {storageType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position Order</Label>
              <Input
                id="position"
                type="number"
                placeholder="0"
                value={positionOrder}
                onChange={(e) => setPositionOrder(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Used for ordering units (0 = first)</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this storage unit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !type}>
              {isLoading ? "Saving..." : unit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
