"use client"

import { useState } from "react"
import { Search, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface SearchResult {
  id: string
  name: string
  description?: string
  current_quantity: number
  par_level: number
  unit_of_measure: string
  expiration_date?: string
  location_name: string
  storage_unit_name?: string
  storage_path: string
}

interface GlobalSearchProps {
  onItemSelect?: (item: SearchResult) => void
  placeholder?: string
  className?: string
}

export function GlobalSearch({
  onItemSelect,
  placeholder = "Search inventory items...",
  className = "",
}: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showResults, setShowResults] = useState(false)

  const results: SearchResult[] = []
  const isLoading = false

  const handleItemClick = (item: SearchResult) => {
    if (onItemSelect) {
      onItemSelect(item)
    }
    setShowResults(false)
    setSearchTerm("")
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowResults(false)} // Disabled search results
          className="pl-10 border-primary/20 focus:border-primary"
          disabled // Disabled input to prevent search attempts
        />
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-primary/20">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Search temporarily disabled</p>
            <p>Search functionality is being updated</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
