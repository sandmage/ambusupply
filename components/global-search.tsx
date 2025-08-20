"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Package, Clock, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface SearchResult {
  id: string
  name: string
  description?: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  expiration_date?: string
  location_name: string
  storage_unit_name?: string
  storage_path: string
}

interface GlobalSearchProps {
  onItemSelect?: (item: SearchResult) => void
}

export function GlobalSearch({ onItemSelect }: GlobalSearchProps) {
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
            quantity,
            min_par_level,
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
              quantity: item.quantity,
              min_par_level: item.min_par_level,
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
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchItems, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, supabase])

  const getStatusIndicators = (item: SearchResult) => {
    const indicators = []

    if (item.quantity < item.min_par_level) {
      indicators.push(
        <Badge key="low" variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Below Par
        </Badge>,
      )
    }

    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      if (expirationDate <= thirtyDaysFromNow) {
        indicators.push(
          <Badge key="expiring" variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Expiring Soon
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

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inventory items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10"
        />
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{item.storage_path}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            Stock:{" "}
                            <span className="font-medium">
                              {item.quantity} {item.unit_of_measure}
                            </span>
                          </span>
                          <span>
                            Par:{" "}
                            <span className="font-medium">
                              {item.min_par_level} {item.unit_of_measure}
                            </span>
                          </span>
                          {item.expiration_date && (
                            <span>
                              Expires:{" "}
                              <span className="font-medium">
                                {format(new Date(item.expiration_date), "MMM dd, yyyy")}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">{getStatusIndicators(item)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No items found matching "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
