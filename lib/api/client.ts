import type { ApiResponse, PaginatedResponse } from "@/lib/types/api"
import { mockApiClient } from "./mock-client"

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      "Content-Type": "application/json",
    }
  }

  private isV0Environment(): boolean {
    if (typeof window === "undefined") return false
    const hostname = window.location.hostname
    return hostname.includes("v0.app") || hostname.includes("localhost") || hostname.includes("127.0.0.1")
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    }

    // Add auth token if available
    const token = this.getAuthToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  private getAuthToken(): string | null {
    // In a real app, this would get the token from secure storage
    return localStorage.getItem("auth_token")
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    if (this.isV0Environment()) {
      console.log("Using mock API client for GET:", endpoint)
      return mockApiClient.get<T>(endpoint)
    }
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    if (this.isV0Environment()) {
      console.log("Using mock API client for POST:", endpoint)
      return mockApiClient.post<T>(endpoint, data)
    }
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    if (this.isV0Environment()) {
      console.log("Using mock API client for PUT:", endpoint)
      return mockApiClient.put<T>(endpoint, data)
    }
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    if (this.isV0Environment()) {
      console.log("Using mock API client for PATCH:", endpoint)
      return mockApiClient.patch<T>(endpoint, data)
    }
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    if (this.isV0Environment()) {
      console.log("Using mock API client for DELETE:", endpoint)
      return mockApiClient.delete<T>(endpoint)
    }
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  // Paginated requests
  async getPaginated<T>(
    endpoint: string,
    params: {
      page?: number
      limit?: number
      sort?: string
      filter?: Record<string, any>
    } = {},
  ): Promise<PaginatedResponse<T>> {
    const searchParams = new URLSearchParams()

    if (params.page) searchParams.set("page", params.page.toString())
    if (params.limit) searchParams.set("limit", params.limit.toString())
    if (params.sort) searchParams.set("sort", params.sort)
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.set(`filter[${key}]`, value.toString())
      })
    }

    const url = `${endpoint}?${searchParams.toString()}`
    return this.request<T[]>(url, { method: "GET" }) as Promise<PaginatedResponse<T>>
  }

  // File upload
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })
    }

    const token = this.getAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("File upload failed:", error)
      throw error
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient()
