"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface AllocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentItem: {
    parent_item_id: string
    parent_item_name: string
    available_for_allocation: number
  }
  availableLocations: Array<{
    id: string
    name: string
  }>
  storageUnits: Array<{
    id: string
    name: string
    location_id: string
  }>
  onAllocationComplete: () => void
}

export function AllocationDialog({
  open,
  onOpenChange,
  parentItem,
  availableLocations,
  storageUnits,
  onAllocationComplete,
}: AllocationDialogProps) {
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [selectedStorageUnitId, setSelectedStorageUnitId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [parLevel, setParLevel] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const availableStorageUnits = storageUnits.filter((unit) => unit.location_id === selectedLocationId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocationId || !quantity) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc("allocate_inventory", {
        p_parent_item_id: parentItem.parent_item_id,
        p_child_location_id: selectedLocationId,
        p_child_storage_unit_id: selectedStorageUnitId || null,
        p_quantity: Number.parseInt(quantity),
        p_par_level: Number.parseInt(parLevel) || 0,
        p_notes: notes || null,
      })

      if (error) throw error

      onAllocationComplete()
      onOpenChange(false)

      // Reset form
      setSelectedLocationId("")
      setSelectedStorageUnitId("")
      setQuantity("")
      setParLevel("")
      setNotes("")
    } catch (error) {
      console.error("Error allocating inventory:", error)
      alert("Failed to allocate inventory. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="hierarchy-heading">Allocate {parentItem.parent_item_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Destination Location</Label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLocationId && availableStorageUnits.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="storage-unit">Storage Unit (Optional)</Label>
              <Select value={selectedStorageUnitId} onValueChange={setSelectedStorageUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select storage unit" />
                </SelectTrigger>
                <SelectContent>
                  {availableStorageUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (Available: {parentItem.available_for_allocation})</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={parentItem.available_for_allocation}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to allocate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="par-level">Par Level</Label>
            <Input
              id="par-level"
              type="number"
              min="0"
              value={parLevel}
              onChange={(e) => setParLevel(e.target.value)}
              placeholder="Minimum stock level"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this allocation"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="hierarchy-button"
              disabled={isSubmitting || !selectedLocationId || !quantity}
            >
              {isSubmitting ? "Allocating..." : "Allocate Inventory"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
