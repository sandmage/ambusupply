"use client"

import type React from "react"
import { SessionProvider, useSession } from "./session-provider"
import { AppSidebar } from "./app-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  user: {
    id?: string
    email: string
    full_name?: string
    role: string
  }
  stats?: {
    belowParCount: number
    expiringCount: number
  }
}

function AppLayoutInner({ children, user, stats }: AppLayoutProps) {
  const { isLoggingOut } = useSession()

  const handleSignOut = async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "GET",
        credentials: "include",
      })

      if (response.redirected) {
        window.location.href = response.url
      } else {
        // Fallback to direct redirect
        window.location.href = "/auth/login"
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback to direct redirect on error
      window.location.href = "/auth/login"
    }
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar user={user} onSignOut={handleSignOut} stats={stats} />
      <main className="flex-1 overflow-hidden ml-2 mr-4 my-4">
        <div className="h-full bg-card rounded-2xl shadow-sm border border-border/50 overflow-auto">
          <div className="h-full p-6">{children}</div>
        </div>
      </main>
    </div>
  )
}

export function AppLayout({ children, user, stats }: AppLayoutProps) {
  const initialUser = user.id
    ? ({
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
    : null

  return (
    <SessionProvider initialUser={initialUser}>
      <AppLayoutInner user={user} stats={stats}>
        {children}
      </AppLayoutInner>
    </SessionProvider>
  )
}
