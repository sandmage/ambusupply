import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    },
    {
      title: "Inventory Management",
      description: "View, add, and manage medical supply inventory",
      href: "/inventory",
      buttonText: "Manage Inventory",
    },
    {
      title: "Analytics & Reports",
      description: "View usage trends, alerts, and generate reports",
      href: "/reports",
      buttonText: "View Reports",
    },
  ]

  const staffActions = [
    {
      title: "Inventory Access",
      description: "View inventory items and record usage",
      href: "/inventory",
      buttonText: "Access Inventory",
    },
    {
      title: "Reports & Search",
      description: "View usage trends and search for items",
      href: "/reports",
      buttonText: "View Reports",
    },
  ]

  const actions = isAdmin ? adminActions : staffActions
  const gridCols = isAdmin ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
      {actions.map((action, index) => (
        <Card key={index} className="border-border hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{action.title}</CardTitle>
            <CardDescription>{action.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <Link href={action.href}>{action.buttonText}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
