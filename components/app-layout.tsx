"use client"

import type React from "react"
import { SessionProvider } from "./session-provider"
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

export function AppLayout({ children, user, stats }: AppLayoutProps) {
  const handleSignOut = async () => {
    // This will be handled by the server action in the parent component
    window.location.href = "/auth/logout"
  }

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
      <div className="flex h-screen bg-background">
        <AppSidebar user={user} onSignOut={handleSignOut} stats={stats} />
        <main className="flex-1 overflow-hidden ml-2 mr-4 my-4">
          <div className="h-full bg-card rounded-2xl shadow-sm border border-border/50 overflow-auto">
            <div className="h-full p-6">{children}</div>
          </div>
        </main>
      </div>
    </SessionProvider>
  )
}
