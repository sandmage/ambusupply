import type { ApiResponse, PaginatedResponse } from "@/lib/types/api"
import {
  mockDb,
  type MockVehicle,
  type MockInventoryItem,
  type MockMedication,
  type MockOrder,
  type MockDailyCheck,
  type MockLocation,
} from "../mock-db"

export class MockApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      "Content-Type": "application/json",
    }
  }

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200))

    const method = options.method || "GET"
    const body = options.body ? JSON.parse(options.body as string) : null

    try {
      // Route the request to appropriate mock handler
      const result = await this.routeRequest<T>(endpoint, method, body)
      return {
        success: true,
        data: result,
        message: "Success",
      }
    } catch (error) {
      console.error("Mock API request failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async routeRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    // Authentication endpoints
    if (endpoint.startsWith("/auth/")) {
      return this.handleAuthRequest<T>(endpoint, method, body)
    }

    // Inventory endpoints
    if (endpoint.startsWith("/inventory/")) {
      return this.handleInventoryRequest<T>(endpoint, method, body)
    }

    // Fleet endpoints
    if (endpoint.startsWith("/fleet/")) {
      return this.handleFleetRequest<T>(endpoint, method, body)
    }

    // Orders endpoints
    if (endpoint.startsWith("/orders")) {
      return this.handleOrdersRequest<T>(endpoint, method, body)
    }

    // Locations endpoints
    if (endpoint.startsWith("/locations")) {
      return this.handleLocationsRequest<T>(endpoint, method, body)
    }

    // Medications endpoints
    if (endpoint.startsWith("/medications")) {
      return this.handleMedicationsRequest<T>(endpoint, method, body)
    }

    // Analytics endpoints
    if (endpoint.startsWith("/analytics/")) {
      return this.handleAnalyticsRequest<T>(endpoint, method, body)
    }

    // Settings endpoints
    if (endpoint.startsWith("/settings")) {
      return this.handleSettingsRequest<T>(endpoint, method, body)
    }

    // Notifications endpoints
    if (endpoint.startsWith("/notifications")) {
      return this.handleNotificationsRequest<T>(endpoint, method, body)
    }

    throw new Error(`Mock API endpoint not implemented: ${endpoint}`)
  }

  private async handleAuthRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    // Auth requests are handled by the client auth service
    throw new Error("Auth requests should use clientAuthService")
  }

  private async handleInventoryRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/inventory/items" && method === "GET") {
      const items = mockDb.findMany<MockInventoryItem>("inventoryItems")
      return { data: items, total: items.length, page: 1, limit: 50 } as T
    }

    if (endpoint.startsWith("/inventory/items/") && method === "GET") {
      const id = endpoint.split("/")[3]
      const item = mockDb.findUnique<MockInventoryItem>("inventoryItems", { id })
      if (!item) throw new Error("Item not found")
      return item as T
    }

    if (endpoint === "/inventory/items" && method === "POST") {
      const newItem = mockDb.create<MockInventoryItem>("inventoryItems", body)
      return newItem as T
    }

    if (endpoint.startsWith("/inventory/items/") && method === "PUT") {
      const id = endpoint.split("/")[3]
      const updatedItem = mockDb.update<MockInventoryItem>("inventoryItems", { id }, body)
      if (!updatedItem) throw new Error("Item not found")
      return updatedItem as T
    }

    if (endpoint.startsWith("/inventory/items/") && method === "DELETE") {
      const id = endpoint.split("/")[3]
      const deleted = mockDb.delete<MockInventoryItem>("inventoryItems", { id })
      if (!deleted) throw new Error("Item not found")
      return { success: true } as T
    }

    if (endpoint === "/inventory/low-stock") {
      const items = mockDb.findMany<MockInventoryItem>("inventoryItems")
      const lowStockItems = items.filter((item) => item.currentStock <= item.minStock)
      return lowStockItems as T
    }

    throw new Error(`Inventory endpoint not implemented: ${endpoint}`)
  }

  private async handleFleetRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/fleet/vehicles" && method === "GET") {
      const vehicles = mockDb.findMany<MockVehicle>("vehicles")
      return { data: vehicles, total: vehicles.length, page: 1, limit: 50 } as T
    }

    if (endpoint.startsWith("/fleet/vehicles/") && method === "GET") {
      const id = endpoint.split("/")[3]
      const vehicle = mockDb.findUnique<MockVehicle>("vehicles", { id })
      if (!vehicle) throw new Error("Vehicle not found")
      return vehicle as T
    }

    if (endpoint === "/fleet/vehicles" && method === "POST") {
      const newVehicle = mockDb.create<MockVehicle>("vehicles", body)
      return newVehicle as T
    }

    if (endpoint === "/fleet/daily-checks" && method === "GET") {
      const checks = mockDb.findMany<MockDailyCheck>("dailyChecks")
      return { data: checks, total: checks.length, page: 1, limit: 50 } as T
    }

    if (endpoint === "/fleet/daily-checks" && method === "POST") {
      const newCheck = mockDb.create<MockDailyCheck>("dailyChecks", body)
      return newCheck as T
    }

    throw new Error(`Fleet endpoint not implemented: ${endpoint}`)
  }

  private async handleOrdersRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/orders" && method === "GET") {
      const orders = mockDb.findMany<MockOrder>("orders")
      return { data: orders, total: orders.length, page: 1, limit: 50 } as T
    }

    if (endpoint.startsWith("/orders/") && method === "GET") {
      const id = endpoint.split("/")[2]
      const order = mockDb.findUnique<MockOrder>("orders", { id })
      if (!order) throw new Error("Order not found")
      return order as T
    }

    if (endpoint === "/orders" && method === "POST") {
      const newOrder = mockDb.create<MockOrder>("orders", body)
      return newOrder as T
    }

    throw new Error(`Orders endpoint not implemented: ${endpoint}`)
  }

  private async handleLocationsRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/locations" && method === "GET") {
      const locations = mockDb.findMany<MockLocation>("locations")
      return { data: locations, total: locations.length, page: 1, limit: 50 } as T
    }

    if (endpoint === "/locations/tree") {
      const locations = mockDb.findMany<MockLocation>("locations")
      return locations as T
    }

    if (endpoint === "/locations" && method === "POST") {
      const newLocation = mockDb.create<MockLocation>("locations", body)
      return newLocation as T
    }

    throw new Error(`Locations endpoint not implemented: ${endpoint}`)
  }

  private async handleMedicationsRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/medications" && method === "GET") {
      const medications = mockDb.findMany<MockMedication>("medications")
      return { data: medications, total: medications.length, page: 1, limit: 50 } as T
    }

    if (endpoint === "/medications" && method === "POST") {
      const newMedication = mockDb.create<MockMedication>("medications", body)
      return newMedication as T
    }

    throw new Error(`Medications endpoint not implemented: ${endpoint}`)
  }

  private async handleAnalyticsRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/analytics/dashboard") {
      const vehicles = mockDb.findMany<MockVehicle>("vehicles")
      const inventory = mockDb.findMany<MockInventoryItem>("inventoryItems")
      const orders = mockDb.findMany<MockOrder>("orders")

      return {
        totalVehicles: vehicles.length,
        inServiceVehicles: vehicles.filter((v) => v.status === "IN_SERVICE").length,
        totalInventoryItems: inventory.length,
        lowStockItems: inventory.filter((i) => i.currentStock <= i.minStock).length,
        pendingOrders: orders.filter((o) => o.status === "PENDING").length,
        totalOrders: orders.length,
      } as T
    }

    if (endpoint === "/analytics/fleet") {
      const vehicles = mockDb.findMany<MockVehicle>("vehicles")
      return {
        statusDistribution: {
          IN_SERVICE: vehicles.filter((v) => v.status === "IN_SERVICE").length,
          OUT_OF_SERVICE: vehicles.filter((v) => v.status === "OUT_OF_SERVICE").length,
          MAINTENANCE: vehicles.filter((v) => v.status === "MAINTENANCE").length,
          REPAIR_SHOP: vehicles.filter((v) => v.status === "REPAIR_SHOP").length,
        },
        averageMileage: vehicles.reduce((sum, v) => sum + v.mileage, 0) / vehicles.length,
        fuelLevels: vehicles.map((v) => ({ unitNumber: v.unitNumber, fuelLevel: v.fuelLevel })),
      } as T
    }

    throw new Error(`Analytics endpoint not implemented: ${endpoint}`)
  }

  private async handleSettingsRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/settings" && method === "GET") {
      const settings = localStorage.getItem("ambusupply_settings") || "{}"
      return JSON.parse(settings) as T
    }

    if (endpoint.startsWith("/settings/") && method === "PUT") {
      const section = endpoint.split("/")[2]
      const currentSettings = JSON.parse(localStorage.getItem("ambusupply_settings") || "{}")
      currentSettings[section] = body
      localStorage.setItem("ambusupply_settings", JSON.stringify(currentSettings))
      return { success: true } as T
    }

    throw new Error(`Settings endpoint not implemented: ${endpoint}`)
  }

  private async handleNotificationsRequest<T>(endpoint: string, method: string, body: any): Promise<T> {
    if (endpoint === "/notifications" && method === "GET") {
      const notifications = mockDb.findMany("notifications") || []
      return { data: notifications, total: notifications.length, page: 1, limit: 50 } as T
    }

    if (endpoint === "/notifications/unread-count") {
      const notifications = mockDb.findMany("notifications") || []
      const unreadCount = notifications.filter((n: any) => !n.isRead).length
      return { count: unreadCount } as T
    }

    if (endpoint === "/notifications/read-all" && method === "PATCH") {
      const notifications = mockDb.findMany("notifications") || []
      notifications.forEach((notification: any) => {
        mockDb.update("notifications", { id: notification.id }, { isRead: true })
      })
      return { success: true } as T
    }

    if (endpoint.match(/^\/notifications\/[^/]+\/read$/) && method === "PATCH") {
      const id = endpoint.split("/")[2]
      const updated = mockDb.update("notifications", { id }, { isRead: true })
      if (!updated) throw new Error("Notification not found")
      return { success: true } as T
    }

    if (endpoint.match(/^\/notifications\/[^/]+$/) && method === "DELETE") {
      const id = endpoint.split("/")[2]
      const deleted = mockDb.delete("notifications", { id })
      if (!deleted) throw new Error("Notification not found")
      return { success: true } as T
    }

    throw new Error(`Notifications endpoint not implemented: ${endpoint}`)
  }

  private getAuthToken(): string | null {
    const authData = localStorage.getItem("auth-storage")
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        return parsed.state?.tokens?.accessToken || null
      } catch {
        return null
      }
    }
    return null
  }

  // Public API methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.mockRequest<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.mockRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.mockRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.mockRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.mockRequest<T>(endpoint, { method: "DELETE" })
  }

  async getPaginated<T>(
    endpoint: string,
    params: {
      page?: number
      limit?: number
      sort?: string
      filter?: Record<string, any>
    } = {},
  ): Promise<PaginatedResponse<T>> {
    const response = await this.mockRequest<T[]>(endpoint, { method: "GET" })
    return response as PaginatedResponse<T>
  }

  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<any>> {
    // Mock file upload
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      success: true,
      data: { url: `mock://uploaded/${file.name}` },
      message: "File uploaded successfully",
    }
  }
}

// Create singleton instance for v0 environment
export const mockApiClient = new MockApiClient()
