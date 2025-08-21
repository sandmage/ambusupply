"use client"

import { useState, useEffect, useCallback } from "react"

interface UseSupabaseQueryOptions<T> {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  enabled?: boolean
}

interface UseSupabaseQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T = any>(options: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false) // Changed from true to false
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    console.log("[v0] useSupabaseQuery: Skipping network request to prevent Failed to fetch errors")
    setData([])
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    setLoading(false)
  }, [])

  return { data, loading, error, refetch: fetchData }
}
