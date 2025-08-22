// Mobile API client for React Native/iOS app integration
export class MobileAPIClient {
  private baseURL: string
  private authToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "API request failed")
    }

    return data
  }

  // Authentication
  async signIn(email: string, password: string) {
    return this.request("/api/mobile/auth", {
      method: "POST",
      body: JSON.stringify({ email, password, action: "signin" }),
    })
  }

  async signUp(email: string, password: string) {
    return this.request("/api/mobile/auth", {
      method: "POST",
      body: JSON.stringify({ email, password, action: "signup" }),
    })
  }

  async verifySession() {
    return this.request("/api/mobile/auth")
  }

  // Vehicles
  async getVehicles(filters?: { status?: string; vehicle_type?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.vehicle_type) params.append("vehicle_type", filters.vehicle_type)

    return this.request(`/api/mobile/vehicles?${params}`)
  }

  // Daily Check Forms
  async getDailyCheckForms(vehicleType?: string) {
    const params = new URLSearchParams()
    if (vehicleType) params.append("vehicle_type", vehicleType)

    return this.request(`/api/mobile/daily-checks/forms?${params}`)
  }

  // Daily Check Submissions
  async submitDailyCheck(submission: any) {
    return this.request("/api/mobile/daily-checks/submissions", {
      method: "POST",
      body: JSON.stringify(submission),
    })
  }

  async getSubmissions(filters?: {
    limit?: number
    offset?: number
    vehicle_id?: string
    date_from?: string
    date_to?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.limit) params.append("limit", filters.limit.toString())
    if (filters?.offset) params.append("offset", filters.offset.toString())
    if (filters?.vehicle_id) params.append("vehicle_id", filters.vehicle_id)
    if (filters?.date_from) params.append("date_from", filters.date_from)
    if (filters?.date_to) params.append("date_to", filters.date_to)

    return this.request(`/api/mobile/daily-checks/submissions?${params}`)
  }

  async getSubmission(id: string) {
    return this.request(`/api/mobile/daily-checks/submissions/${id}`)
  }

  async updateSubmission(id: string, updates: any) {
    return this.request(`/api/mobile/daily-checks/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  // File Upload
  async uploadFile(file: File, type: "photo" | "signature", submissionId?: string) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)
    if (submissionId) formData.append("submission_id", submissionId)

    return this.request("/api/mobile/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })
  }

  // Offline Sync
  async syncData(submissions: any[], lastSync?: string) {
    return this.request("/api/mobile/sync", {
      method: "POST",
      body: JSON.stringify({ submissions, lastSync }),
    })
  }

  async getSyncStatus(lastSync?: string) {
    const params = new URLSearchParams()
    if (lastSync) params.append("last_sync", lastSync)

    return this.request(`/api/mobile/sync?${params}`)
  }
}

// Example usage for React Native/iOS
export const mobileAPI = new MobileAPIClient(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000")
