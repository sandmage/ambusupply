import { DashboardStats } from "@/components/dashboard-stats"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { AlertsPanel } from "@/components/alerts-panel"
import { MobileQuickStats, MobileAlertCard, MobilePerformanceCard } from "@/components/mobile-dashboard-widgets"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <section className="text-center space-y-4 sm:space-y-6 py-6 sm:py-8 animate-fade-in">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground leading-tight px-2">
            Dashboard Overview
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Monitor your emergency services operations in real-time.
          </p>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
        </section>

        <div className="lg:hidden animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <MobileQuickStats />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <DashboardStats />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <QuickActions />
            </div>

            <div className="lg:hidden animate-slide-up" style={{ animationDelay: "0.25s" }}>
              <MobilePerformanceCard />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <RecentActivity />
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="lg:hidden animate-slide-up" style={{ animationDelay: "0.35s" }}>
              <MobileAlertCard />
            </div>

            <div className="hidden lg:block animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <AlertsPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
