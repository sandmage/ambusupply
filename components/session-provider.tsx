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
  const [loading, setLoading] = useState(!initialUser)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!initialUser) {
      let mounted = true

      async function getInitialSession() {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession()

          if (mounted) {
            if (error) {
              console.error("[v0] Session provider error:", error)
              setError(error.message)
            } else {
              setUser(session?.user ?? null)
            }
            setLoading(false)
          }
        } catch (err) {
          console.error("[v0] Session provider failed to get session:", err)
          if (mounted) {
            setError("Failed to load session")
            setLoading(false)
          }
        }
      }

      getInitialSession()

      return () => {
        mounted = false
      }
    } else {
      setLoading(false)
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
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, initialUser])

  return <SessionContext.Provider value={{ user, loading, error }}>{children}</SessionContext.Provider>
}
