"use client"

import { Home, Package, Truck, ShoppingCart, BarChart3, Pill } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/medications", icon: Pill, label: "Medications" },
    { href: "/fleet", icon: Truck, label: "Fleet" },
    { href: "/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border backdrop-blur-sm">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95 ${
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-accent/50"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform duration-200`} />
              <span className="text-xs font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
