"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, MapPin, BarChart3, Users, Settings, LogOut, Menu, X, Activity } from "lucide-react"

interface AppSidebarProps {
  user: {
    email: string
    full_name?: string
    role: string
  }
  onSignOut: () => void
  stats?: {
    belowParCount: number
    expiringCount: number
  }
}

export function AppSidebar({ user, onSignOut, stats }: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const isAdmin = user.role === "admin"

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
      current: pathname === "/inventory",
      badge: stats?.belowParCount ? stats.belowParCount : undefined,
    },
    {
      name: "Locations",
      href: "/locations",
      icon: MapPin,
      current: pathname === "/locations",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      current: pathname === "/reports",
      badge: stats?.expiringCount ? stats.expiringCount : undefined,
    },
  ]

  const adminNavigation = [
    {
      name: "Users",
      href: "/users",
      icon: Users,
      current: pathname === "/users",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: pathname === "/settings",
    },
  ]

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary">AmbuSupply</h1>
              <p className="text-xs text-muted-foreground">Medical Inventory</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.full_name || user.email}</p>
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              item.current
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge variant="destructive" className="h-5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className={cn("pt-4", isCollapsed && "border-t border-sidebar-border")}>
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
              )}
            </div>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.current
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.name}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50",
            isCollapsed && "px-2",
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}
