import type {
  User,
  InventoryItem,
  Vehicle,
  Order,
  Location,
  DailyCheck,
  Report,
  AnalyticsData,
  SystemSettings,
} from "@/lib/types/api"
import { apiClient } from "./client"
import { clientAuthService } from "../auth-client"

// Authentication Service - Updated for v0 client-side auth
export const authService = {
  login: async (email: string, password: string) => {
    const response = await clientAuthService.login(email, password)
    return response
  },

  logout: async () => {
    await clientAuthService.logout()
    return { success: true }
  },

  refreshToken: async () => {
    const response = await clientAuthService.refreshToken()
    return response
  },

  getCurrentUser: async () => {
    // Get current user from auth store or localStorage
    const authData = localStorage.getItem("auth-storage")
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed.state?.user?.id) {
          const response = await clientAuthService.getCurrentUser(parsed.state.user.id)
          return response
        }
      } catch (error) {
        console.error("Error getting current user:", error)
      }
    }
    return { success: false, message: "No authenticated user" }
  },

  updateProfile: (data: Partial<User>) => apiClient.patch<User>("/auth/profile", data),
}

// Activity Service for recent activity functionality
interface ActivityItem {
  id: string
  type: "deployment" | "supply" | "alert" | "maintenance" | "order" | "check" | "medication"
  message: string
  shortMessage: string
  time: string
  status: "active" | "completed" | "warning" | "error"
  icon: string
  metadata?: Record<string, any>
}

export const activityService = {
  getRecentActivities: async (limit = 10) => {
    const response = await apiClient.get<ActivityItem[]>(`/activities?limit=${limit}`)
    if (response.data && Array.isArray(response.data)) {
      return response.data
    }
    return response
  },
}

// Inventory Service
export const inventoryService = {
  getItems: (params?: any) => apiClient.getPaginated<InventoryItem>("/inventory/items", params),

  getItem: (id: string) => apiClient.get<InventoryItem>(`/inventory/items/${id}`),

  createItem: (data: Partial<InventoryItem>) => apiClient.post<InventoryItem>("/inventory/items", data),

  updateItem: (id: string, data: Partial<InventoryItem>) =>
    apiClient.put<InventoryItem>(`/inventory/items/${id}`, data),

  deleteItem: (id: string) => apiClient.delete(`/inventory/items/${id}`),

  updateStock: (id: string, quantity: number, reason: string) =>
    apiClient.post(`/inventory/items/${id}/stock`, { quantity, reason }),

  getLowStockItems: () => apiClient.get<InventoryItem[]>("/inventory/low-stock"),

  getCategories: () => apiClient.get("/inventory/categories"),
}

// Fleet Service
export const fleetService = {
  getVehicles: (params?: any) => apiClient.getPaginated<Vehicle>("/fleet/vehicles", params),

  getVehicle: (id: string) => apiClient.get<Vehicle>(`/fleet/vehicles/${id}`),

  createVehicle: (data: Partial<Vehicle>) => apiClient.post<Vehicle>("/fleet/vehicles", data),

  updateVehicle: (id: string, data: Partial<Vehicle>) => apiClient.put<Vehicle>(`/fleet/vehicles/${id}`, data),

  deleteVehicle: (id: string) => apiClient.delete(`/fleet/vehicles/${id}`),

  updateLocation: (id: string, location: { latitude: number; longitude: number }) =>
    apiClient.patch(`/fleet/vehicles/${id}/location`, location),

  deployVehicle: (id: string, deployment: any) => apiClient.post(`/fleet/vehicles/${id}/deploy`, deployment),

  returnVehicle: (id: string) => apiClient.post(`/fleet/vehicles/${id}/return`, {}),
}

// Daily Checks Service
export const dailyChecksService = {
  getChecks: (vehicleId?: string, params?: any) =>
    apiClient.getPaginated<DailyCheck>("/fleet/daily-checks", { ...params, vehicleId }),

  getCheck: (id: string) => apiClient.get<DailyCheck>(`/fleet/daily-checks/${id}`),

  createCheck: (data: Partial<DailyCheck>) => apiClient.post<DailyCheck>("/fleet/daily-checks", data),

  updateCheck: (id: string, data: Partial<DailyCheck>) => apiClient.put<DailyCheck>(`/fleet/daily-checks/${id}`, data),

  submitCheck: (id: string) => apiClient.post(`/fleet/daily-checks/${id}/submit`, {}),

  getCheckItems: () => apiClient.get("/fleet/daily-checks/items"),
}

// Orders Service
export const ordersService = {
  getOrders: (params?: any) => apiClient.getPaginated<Order>("/orders", params),

  getOrder: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  createOrder: (data: Partial<Order>) => apiClient.post<Order>("/orders", data),

  updateOrder: (id: string, data: Partial<Order>) => apiClient.put<Order>(`/orders/${id}`, data),

  deleteOrder: (id: string) => apiClient.delete(`/orders/${id}`),

  approveOrder: (id: string, notes?: string) => apiClient.post(`/orders/${id}/approve`, { notes }),

  rejectOrder: (id: string, reason: string) => apiClient.post(`/orders/${id}/reject`, { reason }),

  submitOrder: (id: string) => apiClient.post(`/orders/${id}/submit`, {}),
}

// Locations Service
export const locationsService = {
  getLocations: (params?: any) => apiClient.getPaginated<Location>("/locations", params),

  getLocation: (id: string) => apiClient.get<Location>(`/locations/${id}`),

  createLocation: (data: Partial<Location>) => apiClient.post<Location>("/locations", data),

  updateLocation: (id: string, data: Partial<Location>) => apiClient.put<Location>(`/locations/${id}`, data),

  deleteLocation: (id: string) => apiClient.delete(`/locations/${id}`),

  getLocationTree: () => apiClient.get<Location[]>("/locations/tree"),

  moveInventory: (fromLocationId: string, toLocationId: string, items: any[]) =>
    apiClient.post("/locations/move-inventory", { fromLocationId, toLocationId, items }),
}

// Reports Service
export const reportsService = {
  getReports: (params?: any) => apiClient.getPaginated<Report>("/reports", params),

  getReport: (id: string) => apiClient.get<Report>(`/reports/${id}`),

  generateReport: (type: string, parameters: any) => apiClient.post<Report>("/reports/generate", { type, parameters }),

  downloadReport: (id: string, format: string) => apiClient.get(`/reports/${id}/download?format=${format}`),

  getAnalytics: (type: string, params?: any) => apiClient.get<AnalyticsData>(`/analytics/${type}`, params),
}

// Settings Service
export const settingsService = {
  getSettings: () => apiClient.get<SystemSettings>("/settings"),

  updateSettings: (section: string, data: any) => apiClient.put(`/settings/${section}`, data),

  resetSettings: (section: string) => apiClient.post(`/settings/${section}/reset`, {}),

  exportSettings: () => apiClient.get("/settings/export"),

  importSettings: (file: File) => apiClient.uploadFile("/settings/import", file),
}

// Notifications Service
export const notificationsService = {
  getNotifications: async (params?: any) => {
    const response = await apiClient.getPaginated("/notifications", params)
    return response.data ? response : response
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.patch(`/notifications/${id}/read`, {})
    return response.data ? response.data : response
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch("/notifications/read-all", {})
    return response.data ? response.data : response
  },

  deleteNotification: async (id: string) => {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data ? response.data : response
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<{ count: number }>("/notifications/unread-count")
    if (response.data && typeof response.data === "object" && "count" in response.data) {
      return response.data
    }
    return response
  },
}
