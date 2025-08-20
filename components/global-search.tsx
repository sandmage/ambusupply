"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Package, Clock, AlertTriangle, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

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
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const searchItems = async () => {
      if (searchTerm.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("inventory_items")
          .select(`
            id,
            name,
            description,
            current_quantity,
            par_level,
            unit_of_measure,
            expiration_date,
            locations!inner (
              name
            ),
            storage_units (
              name
            )
          `)
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(10)

        if (!error && data) {
          const transformedResults = data.map((item: any) => {
            const storagePath = item.storage_units?.name
              ? `${item.locations.name} > ${item.storage_units.name}`
              : item.locations.name

            return {
              id: item.id,
              name: item.name,
              description: item.description,
              current_quantity: item.current_quantity,
              par_level: item.par_level,
              unit_of_measure: item.unit_of_measure,
              expiration_date: item.expiration_date,
              location_name: item.locations.name,
              storage_unit_name: item.storage_units?.name,
              storage_path: storagePath,
            }
          })
          setResults(transformedResults)
          setShowResults(true)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchItems, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, supabase])

  const getStatusIndicators = (item: SearchResult) => {
    const indicators = []

    if (item.current_quantity < item.par_level) {
      indicators.push(
        <Badge key="low" variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>,
      )
    }

    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      if (expirationDate <= thirtyDaysFromNow) {
        indicators.push(
          <Badge key="expiring" variant="secondary" className="text-xs bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Expiring
          </Badge>,
        )
      }
    }

    return indicators
  }

  const handleItemClick = (item: SearchResult) => {
    if (onItemSelect) {
      onItemSelect(item)
    }
    setShowResults(false)
    setSearchTerm("")
  }

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 border-primary/20 focus:border-primary"
        />
        {isLoading && (
          <Zap className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
        )}
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-primary/20">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 animate-pulse" />
                Searching medical supplies...
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-primary/5 cursor-pointer transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-gray-900">{highlightMatch(item.name, searchTerm)}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{highlightMatch(item.description, searchTerm)}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{item.storage_path}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <span className="text-gray-500">Stock:</span>
                            <span
                              className={`font-semibold ${item.current_quantity < item.par_level ? "text-red-600" : "text-green-600"}`}
                            >
                              {item.current_quantity} {item.unit_of_measure}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-gray-500">Par:</span>
                            <span className="font-medium text-gray-700">
                              {item.par_level} {item.unit_of_measure}
                            </span>
                          </span>
                          {item.expiration_date && (
                            <span className="flex items-center gap-1">
                              <span className="text-gray-500">Expires:</span>
                              <span className="font-medium text-gray-700">
                                {format(new Date(item.expiration_date), "MMM dd, yyyy")}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-4">{getStatusIndicators(item)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">No items found</p>
                <p>Try searching with different keywords</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
