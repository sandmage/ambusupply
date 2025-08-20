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
        /* Updated sidebar with Apple-esque glass morphism and rounded corners */
        "flex flex-col h-full apple-glass backdrop-blur-xl rounded-r-2xl border-r border-border/30 transition-all duration-300 ease-out shadow-lg m-4 mr-0",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex items-center justify-between p-6 border-b border-border/20">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-primary">AmbuSupply</h1>
              <p className="text-sm text-muted-foreground font-medium">Medical Inventory</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 transition-all duration-200"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-sm border border-border/30">
              <span className="text-lg font-serif font-bold text-primary">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{user.full_name || user.email}</p>
              <Badge variant="secondary" className="text-xs font-medium rounded-lg px-2 py-1 mt-1">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-6 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center space-x-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group",
              item.current
                ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                : "text-foreground hover:bg-primary/10 hover:scale-[1.01] active:scale-[0.99]",
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                item.current ? "scale-110" : "group-hover:scale-105",
              )}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 font-medium">{item.name}</span>
                {item.badge && (
                  <Badge variant="destructive" className="h-6 text-xs font-semibold rounded-lg px-2 shadow-sm">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className={cn("pt-6", isCollapsed && "border-t border-border/20 mt-4")}>
              {!isCollapsed && (
                <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Administration
                </p>
              )}
            </div>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group",
                  item.current
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                    : "text-foreground hover:bg-primary/10 hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                    item.current ? "scale-110" : "group-hover:scale-105",
                  )}
                />
                {!isCollapsed && <span className="flex-1 font-medium">{item.name}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-6 border-t border-border/20">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className={cn(
            "w-full justify-start text-foreground hover:bg-destructive/10 hover:text-destructive rounded-2xl py-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
            isCollapsed && "px-3",
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-4 font-medium">Sign Out</span>}
        </Button>
      </div>
    </div>
  )
}
