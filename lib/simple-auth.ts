export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "ADMIN" | "MANAGER" | "USER" | "VIEWER"
  isActive: boolean
  organizationId: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

// Demo user for both v0 and local environments
const DEMO_USER: User = {
  id: "admin-001",
  email: "admin@metroems.com",
  firstName: "Admin",
  lastName: "User",
  role: "ADMIN",
  isActive: true,
  organizationId: "metro-ems-001",
}

function setCookie(name: string, value: string, days = 7): void {
  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    const encodedValue = encodeURIComponent(value)
    document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  } catch (error) {
    console.warn("Failed to set cookie:", error)
  }
}

function deleteCookie(name: string): void {
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  } catch (error) {
    console.warn("Failed to delete cookie:", error)
  }
}

class SimpleAuth {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  }

  private listeners: Array<(state: AuthState) => void> = []

  constructor() {
    // Initialize from localStorage on startup
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("ambusupply_auth")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.token && parsed.user) {
          this.state = {
            isAuthenticated: true,
            user: parsed.user,
            token: parsed.token,
          }
          console.log("SimpleAuth: Loaded existing session from storage")
        }
      }
    } catch (error) {
      console.warn("SimpleAuth: Failed to load from storage:", error)
    }
  }

  private saveToStorage(): void {
    try {
      const authData = {
        user: this.state.user,
        token: this.state.token,
      }

      // Save to localStorage
      localStorage.setItem("ambusupply_auth", JSON.stringify(authData))

      setCookie("ambusupply_auth", JSON.stringify(authData))

      console.log("SimpleAuth: Saved auth data to storage and cookies")
    } catch (error) {
      console.warn("SimpleAuth: Failed to save to storage:", error)
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state))
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  getState(): AuthState {
    return { ...this.state }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    console.log("SimpleAuth: Attempting login", { email, password: "***" })

    // Simple validation - accept demo credentials or any valid email with "admin123"
    const isValidEmail = email.includes("@") && email.includes(".")
    const isValidPassword = password === "admin123"

    if (!isValidEmail) {
      console.log("SimpleAuth: Invalid email format")
      return { success: false, message: "Please enter a valid email address" }
    }

    if (!isValidPassword) {
      console.log("SimpleAuth: Invalid password")
      return { success: false, message: "Invalid email or password" }
    }

    // Generate simple token
    const token = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Update state
    this.state = {
      isAuthenticated: true,
      user: { ...DEMO_USER, email }, // Use provided email but demo user data
      token,
    }

    // Persist to storage and cookies
    this.saveToStorage()

    // Notify listeners
    this.notify()

    console.log("SimpleAuth: Login successful, auth data saved")
    return { success: true }
  }

  logout(): void {
    console.log("SimpleAuth: Logging out")

    // Clear state
    this.state = {
      isAuthenticated: false,
      user: null,
      token: null,
    }

    // Clear storage and cookies
    try {
      localStorage.removeItem("ambusupply_auth")
      deleteCookie("ambusupply_auth")
    } catch (error) {
      console.warn("SimpleAuth: Failed to clear storage:", error)
    }

    // Notify listeners
    this.notify()
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.state.user !== null && this.state.token !== null
  }

  getUser(): User | null {
    return this.state.user
  }

  getToken(): string | null {
    return this.state.token
  }
}

// Export singleton instance
export const simpleAuth = new SimpleAuth()
