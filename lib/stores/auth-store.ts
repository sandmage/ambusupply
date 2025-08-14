"use client"

import { useState, useEffect, useCallback } from "react"
import { simpleAuth, type User, type AuthState } from "@/lib/simple-auth"

// Custom hook for auth state management
export function useAuthStore() {
  const [state, setState] = useState<AuthState>(simpleAuth.getState())
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = simpleAuth.subscribe((newState) => {
      console.log("Auth state changed:", newState)
      setState(newState)
    })

    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      console.log("useAuthStore: Starting login process")
      const result = await simpleAuth.login(email, password)
      console.log("useAuthStore: Login result:", result)
      return result.success
    } catch (error) {
      console.error("useAuthStore: Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    console.log("useAuthStore: Logging out")
    simpleAuth.logout()
  }, [])

  const updateUser = useCallback((userData: Partial<User>) => {
    // For now, just log the update - could extend simpleAuth to support this
    console.log("useAuthStore: User update requested:", userData)
  }, [])

  const checkAuth = useCallback(async () => {
    // Simple auth automatically loads from storage on initialization
    console.log("useAuthStore: Auth check - current state:", simpleAuth.getState())
  }, [])

  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading,

    // Legacy compatibility - some components might expect tokens
    tokens: state.token ? { accessToken: state.token, refreshToken: "", expiresAt: "" } : null,

    // Actions
    login,
    logout,
    updateUser,
    checkAuth,

    // Additional helper methods
    refreshToken: async () => {
      // For demo purposes, always return true
      console.log("useAuthStore: Token refresh requested")
      return true
    },
  }
}

// Export a singleton hook for backward compatibility
const authStoreInstance: ReturnType<typeof useAuthStore> | null = null

export function getAuthStore() {
  if (!authStoreInstance) {
    // This is a simplified version for non-React contexts
    return {
      user: simpleAuth.getUser(),
      isAuthenticated: simpleAuth.isAuthenticated(),
      tokens: simpleAuth.getToken() ? { accessToken: simpleAuth.getToken()!, refreshToken: "", expiresAt: "" } : null,
      isLoading: false,
      login: simpleAuth.login.bind(simpleAuth),
      logout: simpleAuth.logout.bind(simpleAuth),
      updateUser: () => {},
      checkAuth: async () => {},
      refreshToken: async () => true,
    }
  }
  return authStoreInstance
}
