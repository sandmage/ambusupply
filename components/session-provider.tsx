"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface SessionContextType {
  user: User | null
  loading: boolean
  error: string | null
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  error: null,
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

  useEffect(() => {
    console.log("[v0] Session provider: Using custom session management")

    if (initialUser) {
      console.log("[v0] Session provider: Using initial user data", initialUser.id)
      setUser(initialUser)
    }

    setLoading(false)
  }, [initialUser])

  const updateUser = (newUser: User | null) => {
    setUser(newUser)
  }

  const clearSession = () => {
    setUser(null)
    setError(null)
  }

  return <SessionContext.Provider value={{ user, loading, error }}>{children}</SessionContext.Provider>
}
