"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Location {
  id?: string
  name: string
  description?: string
}

interface LocationFormProps {
  location?: Location
  isOpen: boolean
  onClose: () => void
  onSave: (location: Omit<Location, "id">) => Promise<void>
}

export function LocationForm({ location, isOpen, onClose, onSave }: LocationFormProps) {
  const [name, setName] = useState(location?.name || "")
  const [description, setDescription] = useState(location?.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onClose()
      setName("")
      setDescription("")
    } catch (error) {
      setError("Failed to save location. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setName(location?.name || "")
    setDescription(location?.description || "")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add New Location"}</DialogTitle>
          <DialogDescription>
            {location ? "Update the location details." : "Create a new storage location."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Supply Closet, Bay 1 Cabinet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this location..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Saving..." : location ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
