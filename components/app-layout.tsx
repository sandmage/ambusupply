"use client"

import type React from "react"

import { AppSidebar } from "./app-sidebar"

interface AppLayoutProps {
  children: React.ReactNode
  user: {
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar user={user} onSignOut={handleSignOut} stats={stats} />
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  )
}
