"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface StorageUnitType {
  id?: string
  name: string
  description?: string // Made description optional to match locations-client interface
  capacity_type: string
  default_capacity?: number // Made default_capacity optional to match locations-client interface
}

interface StorageUnitTypeFormProps {
  storageType?: StorageUnitType
  isOpen: boolean
  onClose: () => void
  onSave: (storageType: Omit<StorageUnitType, "id">) => Promise<void>
}

export function StorageUnitTypeForm({ storageType, isOpen, onClose, onSave }: StorageUnitTypeFormProps) {
  const [name, setName] = useState(storageType?.name || "")
  const [description, setDescription] = useState(storageType?.description || "")
  const [capacityType, setCapacityType] = useState(storageType?.capacity_type || "count")
  const [defaultCapacity, setDefaultCapacity] = useState(storageType?.default_capacity?.toString() || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Storage unit type form submission started")
    console.log("[v0] Form values:", { name, description, capacityType, defaultCapacity })

    try {
      const storageTypeData = {
        name: name.trim(),
        description: description.trim() || undefined, // Handle optional description
        capacity_type: capacityType,
        default_capacity: defaultCapacity ? Number.parseInt(defaultCapacity) : undefined,
      }
      console.log("[v0] Prepared storage type data for save:", storageTypeData)

      await onSave(storageTypeData)
      console.log("[v0] Storage unit type save completed successfully")
      onClose()
      resetForm()
    } catch (error: any) {
      console.error("[v0] Error in storage unit type form submission:", error)
      setError(error.message || "Failed to save storage unit type. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName(storageType?.name || "")
    setDescription(storageType?.description || "")
    setCapacityType(storageType?.capacity_type || "count")
    setDefaultCapacity(storageType?.default_capacity?.toString() || "")
    setError(null)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{storageType ? "Edit Storage Unit Type" : "Add Storage Unit Type"}</DialogTitle>
          <DialogDescription>
            {storageType
              ? "Update the storage unit type details."
              : "Create a new storage unit type for your organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Type Name</Label>
              <Input
                id="name"
                placeholder="e.g., Cabinet, Drawer, Shelf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="capacity_type">Capacity Type</Label>
              <Select value={capacityType} onValueChange={setCapacityType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select capacity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="volume">Volume (L)</SelectItem>
                  <SelectItem value="weight">Weight (kg)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="default_capacity">Default Capacity</Label>
              <Input
                id="default_capacity"
                type="number"
                placeholder="0"
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(e.target.value)}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Default capacity for new storage units of this type</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Saving..." : storageType ? "Update Type" : "Create Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
