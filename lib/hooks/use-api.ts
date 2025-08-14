"use client"

import { useState, useEffect, useCallback } from "react"
import type { ApiResponse, PaginatedResponse } from "@/lib/types/api"

interface UseApiOptions<T> {
  initialData?: T
  autoFetch?: boolean
  dependencies?: any[]
}

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (newData: T) => void
}

export function useApi<T>(apiCall: () => Promise<ApiResponse<T>>, options: UseApiOptions<T> = {}): UseApiState<T> {
  const { initialData = null, autoFetch = true, dependencies = [] } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiCall()

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || "Failed to fetch data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [apiCall])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
  }
}

interface UsePaginatedApiState<T> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
}

export function usePaginatedApi<T>(
  apiCall: (params: any) => Promise<PaginatedResponse<T>>,
  initialParams: any = {},
): UsePaginatedApiState<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [params, setParams] = useState({ page: 1, limit: 20, ...initialParams })

  const fetchData = useCallback(
    async (reset = false) => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiCall(params)

        if (response.success && response.data) {
          setData(reset ? response.data : [...data, ...response.data])
          setPagination(response.pagination)
        } else {
          setError(response.error || "Failed to fetch data")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    },
    [apiCall, params, data],
  )

  const loadMore = useCallback(async () => {
    if (pagination?.hasNext) {
      setParams((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }, [pagination])

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }))
    setData([])
  }, [])

  const setLimit = useCallback((limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }))
    setData([])
  }, [])

  useEffect(() => {
    fetchData(params.page === 1)
  }, [params])

  return {
    data,
    loading,
    error,
    pagination,
    refetch: () => fetchData(true),
    loadMore,
    setPage,
    setLimit,
  }
}

interface UseMutationState<T, P> {
  mutate: (params: P) => Promise<T | null>
  loading: boolean
  error: string | null
  data: T | null
}

export function useMutation<T, P>(apiCall: (params: P) => Promise<ApiResponse<T>>): UseMutationState<T, P> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiCall(params)

        if (response.success && response.data) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error || "Mutation failed")
          return null
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred"
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiCall],
  )

  return {
    mutate,
    loading,
    error,
    data,
  }
}
