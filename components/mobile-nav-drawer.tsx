"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Home,
  Package,
  MapPin,
  Truck,
  ShoppingCart,
  BarChart3,
  Settings,
  Wrench,
  Bell,
  User,
  Pill,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"

export function MobileNavDrawer() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuthStore()

  const primaryNavItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/medications", icon: Pill, label: "Medications" },
    { href: "/locations", icon: MapPin, label: "Locations" },
    { href: "/fleet", icon: Truck, label: "Fleet" },
    { href: "/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ]

  const secondaryNavItems = [
    { href: "/setup", icon: Wrench, label: "Setup" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  const handleNavClick = () => {
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    router.push("/login")
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">A</span>
            </div>
            <SheetTitle className="text-xl font-bold">AmbuSupply</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 py-6">
            <div className="px-6 mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Main Navigation
              </h3>
              <nav className="space-y-2">
                {primaryNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "text-primary bg-primary/10 border border-primary/20"
                          : "text-muted-foreground hover:text-primary hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="px-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">System</h3>
              <nav className="space-y-2">
                {secondaryNavItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "text-primary bg-primary/10 border border-primary/20"
                          : "text-muted-foreground hover:text-primary hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          <div className="border-t p-6">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1 bg-transparent text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
