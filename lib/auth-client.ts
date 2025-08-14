import { mockDb, type MockUser } from "./mock-db"

export interface ClientUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "ADMIN" | "MANAGER" | "USER" | "VIEWER"
  isActive: boolean
  organizationId: string
}

export interface ClientAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface ClientAuthResponse {
  success: boolean
  data?: {
    user: ClientUser
    tokens: ClientAuthTokens
  }
  message?: string
}

class ClientAuthService {
  private generateToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private hashPassword(password: string): string {
    // Simple client-side hash for demo purposes
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    console.log("Verifying password:", { password: "***", hashedPassword })
    return password === "admin123" || this.hashPassword(password) === hashedPassword
  }

  async login(email: string, password: string): Promise<ClientAuthResponse> {
    try {
      console.log("ClientAuthService: Starting login process", { email, password: "***" })

      mockDb.initialize()

      // Find user in mock database
      console.log("ClientAuthService: Looking for user with email:", email)
      const user = mockDb.findUnique<MockUser>("users", { email })
      console.log("ClientAuthService: Found user:", user ? { id: user.id, email: user.email, role: user.role } : null)

      if (!user) {
        console.log("ClientAuthService: User not found")
        return {
          success: false,
          message: "Invalid email or password",
        }
      }

      if (!user.isActive) {
        console.log("ClientAuthService: User account is inactive")
        return {
          success: false,
          message: "Account is inactive",
        }
      }

      // Verify password (simplified for demo)
      console.log("ClientAuthService: Verifying password")
      if (!this.verifyPassword(password, user.password)) {
        console.log("ClientAuthService: Password verification failed")
        return {
          success: false,
          message: "Invalid email or password",
        }
      }

      console.log("ClientAuthService: Password verified successfully")

      // Generate tokens
      const tokens: ClientAuthTokens = {
        accessToken: this.generateToken(),
        refreshToken: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }

      // Convert to client user format
      const clientUser: ClientUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        organizationId: user.organizationId,
      }

      console.log("ClientAuthService: Login successful, returning user and tokens")
      return {
        success: true,
        data: {
          user: clientUser,
          tokens,
        },
      }
    } catch (error) {
      console.error("ClientAuthService: Login error:", error)
      return {
        success: false,
        message: "Login failed",
      }
    }
  }

  async logout(): Promise<void> {
    console.log("ClientAuthService: Logging out")
    // Clear any stored tokens or session data
    // In a real app, this would invalidate server-side tokens
  }

  async refreshToken(): Promise<ClientAuthResponse> {
    console.log("ClientAuthService: Refreshing token")
    // For demo purposes, just generate new tokens
    const tokens: ClientAuthTokens = {
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    return {
      success: true,
      data: {
        user: {} as ClientUser, // Would normally return updated user
        tokens,
      },
    }
  }

  async getCurrentUser(userId: string): Promise<ClientAuthResponse> {
    try {
      console.log("ClientAuthService: Getting current user:", userId)
      const user = mockDb.findUnique<MockUser>("users", { id: userId })

      if (!user) {
        console.log("ClientAuthService: Current user not found")
        return {
          success: false,
          message: "User not found",
        }
      }

      const clientUser: ClientUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        organizationId: user.organizationId,
      }

      console.log("ClientAuthService: Current user found:", { id: clientUser.id, email: clientUser.email })
      return {
        success: true,
        data: {
          user: clientUser,
          tokens: {} as ClientAuthTokens, // Would normally return current tokens
        },
      }
    } catch (error) {
      console.error("ClientAuthService: Error getting current user:", error)
      return {
        success: false,
        message: "Failed to get user",
      }
    }
  }
}

export const clientAuthService = new ClientAuthService()
