"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
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
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    console.log("[v0] Session provider: Setting up passive auth listener")

    if (initialUser) {
      console.log("[v0] Session provider: Using initial user data", initialUser.id)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)

      if (event === "SIGNED_OUT") {
        setUser(null)
        setError(null)
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null)
        setError(null)
      } else if (event === "INITIAL_SESSION") {
        setUser(session?.user ?? null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, initialUser])

  return <SessionContext.Provider value={{ user, loading, error }}>{children}</SessionContext.Provider>
}
