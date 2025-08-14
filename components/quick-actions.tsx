"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Truck, Package, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { HapticButton } from "@/components/touch-interactions/haptic-button"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      title: "New Order",
      description: "Create supply order",
      icon: Plus,
      gradient: "from-primary to-primary/80",
      hoverGradient: "hover:from-primary/90 hover:to-primary/70",
      onClick: () => router.push("/orders"),
      hapticType: "medium" as const,
    },
    {
      title: "Deploy Ambulance",
      description: "Assign to emergency",
      icon: Truck,
      gradient: "from-red-600 to-red-500",
      hoverGradient: "hover:from-red-700 hover:to-red-600",
      onClick: () => router.push("/fleet"),
      hapticType: "heavy" as const,
    },
    {
      title: "Check Inventory",
      description: "View stock levels",
      icon: Package,
      gradient: "from-emerald-600 to-emerald-500",
      hoverGradient: "hover:from-emerald-700 hover:to-emerald-600",
      onClick: () => router.push("/inventory"),
      hapticType: "light" as const,
    },
    {
      title: "Generate Report",
      description: "Create analytics report",
      icon: FileText,
      gradient: "from-blue-600 to-blue-500",
      hoverGradient: "hover:from-blue-700 hover:to-blue-600",
      onClick: () => router.push("/reports"),
      hapticType: "light" as const,
    },
  ]

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-6">
        <CardTitle className="flex items-center space-x-2 font-heading text-lg sm:text-xl">
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {actions.map((action, index) => (
            <HapticButton
              key={index}
              variant="outline"
              hapticType={action.hapticType}
              className={`h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 sm:space-y-3 bg-gradient-to-br ${action.gradient} ${action.hoverGradient} text-white border-0 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl group touch-target`}
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform duration-200" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-heading leading-tight">{action.title}</div>
                <div className="text-xs opacity-90 hidden sm:block">{action.description}</div>
              </div>
            </HapticButton>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
