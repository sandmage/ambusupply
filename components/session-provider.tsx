"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface SessionContextType {
  user: User | null
  loading: boolean
  error: string | null
  isLoggingOut: boolean
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  error: null,
  isLoggingOut: false,
})

export function useSession() {
  return useContext(SessionContext)
}

interface SessionProviderProps {
  children: React.ReactNode
  initialUser?: User | null
}

export function SessionProvider({ children, initialUser = null }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    console.log("[v0] Session provider: Using custom session management")

    if (initialUser) {
      console.log("[v0] Session provider: Using initial user data", initialUser.id)
      setUser(initialUser)
    }

    setLoading(false)
  }, [initialUser])

  useEffect(() => {
    return () => {
      // Cleanup function to prevent state updates after unmount
      setIsLoggingOut(false)
    }
  }, [])

  const updateUser = (newUser: User | null) => {
    if (!isLoggingOut) {
      setUser(newUser)
    }
  }

  const clearSession = () => {
    setIsLoggingOut(true)
    setUser(null)
    setError(null)
  }

  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Signing out...</p>
        </div>
      </div>
    )
  }

  return <SessionContext.Provider value={{ user, loading, error, isLoggingOut }}>{children}</SessionContext.Provider>
}
