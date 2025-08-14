"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut } from "@/components/ui/icons"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { MobileNavDrawer } from "./mobile-nav-drawer"
import { useAuthStore } from "@/lib/stores/auth-store"
import { NotificationCenter } from "./notifications/notification-center"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleSettings = () => {
    router.push("/settings")
  }

  const handleAccountSettings = () => {
    router.push("/account")
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="border-b bg-card/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MobileNavDrawer />

            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-foreground hidden xs:block">AmbuSupply</span>
              <span className="text-lg font-bold text-foreground xs:hidden lg:hidden">AS</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-6">
            <Link
              href="/"
              className={`transition-colors font-medium ${pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/inventory"
              className={`transition-colors font-medium ${pathname === "/inventory" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Inventory
            </Link>
            <Link
              href="/medications"
              className={`transition-colors font-medium ${pathname === "/medications" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Medications
            </Link>
            <Link
              href="/locations"
              className={`transition-colors font-medium ${pathname === "/locations" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Locations
            </Link>
            <Link
              href="/fleet"
              className={`transition-colors font-medium ${pathname === "/fleet" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Fleet
            </Link>
            <Link
              href="/orders"
              className={`transition-colors font-medium ${pathname === "/orders" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Orders
            </Link>
            <Link
              href="/reports"
              className={`transition-colors font-medium ${pathname === "/reports" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Reports
            </Link>
            <Link
              href="/setup"
              className={`transition-colors font-medium ${pathname === "/setup" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              Setup
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex">
              <NotificationCenter />
            </div>

            <Button variant="ghost" size="icon" onClick={handleSettings} className="touch-manipulation">
              <Settings className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="touch-manipulation">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAccountSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
