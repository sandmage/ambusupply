"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

export function InventoryFilters() {
  const [activeFilters, setActiveFilters] = useState<string[]>(["Low Stock", "Emergency Category"])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const removeFilter = (filterToRemove: string) => {
    setActiveFilters((prev) => prev.filter((filter) => filter !== filterToRemove))

    // Reset the corresponding select value
    if (filterToRemove === "Low Stock") {
      setSelectedStatus("")
    } else if (filterToRemove === "Emergency Category") {
      setSelectedCategory("")
    }
  }

  const clearAllFilters = () => {
    setActiveFilters([])
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedStatus("")
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    if (value === "emergency" && !activeFilters.includes("Emergency Category")) {
      setActiveFilters((prev) => [...prev, "Emergency Category"])
    } else if (value !== "emergency") {
      setActiveFilters((prev) => prev.filter((filter) => filter !== "Emergency Category"))
    }
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    if (value === "low-stock" && !activeFilters.includes("Low Stock")) {
      setActiveFilters((prev) => [...prev, "Low Stock"])
    } else if (value !== "low-stock") {
      setActiveFilters((prev) => prev.filter((filter) => filter !== "Low Stock"))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medical supplies..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="medications">Medications</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="consumables">Consumables</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              {filter}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeFilter(filter)} />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
