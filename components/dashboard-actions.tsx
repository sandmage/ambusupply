import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Package, BarChart3, Search } from "lucide-react"
import Link from "next/link"

interface DashboardActionsProps {
  isAdmin: boolean
}

export function DashboardActions({ isAdmin }: DashboardActionsProps) {
  const adminActions = [
    {
      title: "Storage Locations",
      description: "Manage physical storage locations and organizational units",
      href: "/locations",
      buttonText: "Manage Locations",
      icon: MapPin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Inventory Management",
      description: "View, add, and manage medical supply inventory",
      href: "/inventory",
      buttonText: "Manage Inventory",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Analytics & Reports",
      description: "View usage trends, alerts, and generate reports",
      href: "/reports",
      buttonText: "View Reports",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  const staffActions = [
    {
      title: "Inventory Access",
      description: "View inventory items and record usage",
      href: "/inventory",
      buttonText: "Access Inventory",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Reports & Search",
      description: "View usage trends and search for items",
      href: "/reports",
      buttonText: "View Reports",
      icon: Search,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  const actions = isAdmin ? adminActions : staffActions
  const gridCols = isAdmin ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
      {actions.map((action, index) => (
        <Card key={index} className="apple-card group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4 mb-3">
              <div
                className={`p-3 rounded-2xl ${action.bgColor} transition-transform duration-200 group-hover:scale-110`}
              >
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
            </div>
            <CardTitle className="text-xl font-serif font-bold text-primary">{action.title}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">{action.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="apple-button w-full">
              <Link href={action.href}>{action.buttonText}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
