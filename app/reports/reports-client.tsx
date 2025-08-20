"use client"

import { useState } from "react"
import { ArrowLeft, Download, AlertTriangle, Clock, Package, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalSearch } from "@/components/global-search"
import { AlertsSummary } from "@/components/alerts-summary"
import { UsageTrendsChart } from "@/components/usage-trends-chart"
import Link from "next/link"

interface AlertItem {
  id: string
  name: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  expiration_date?: string
  location_name: string
  storage_unit_name?: string
}

interface UsageTrendData {
  item_name: string
  total_used: number
  avg_daily_usage: number
  location_name: string
}

interface ReportsClientProps {
  belowParItems: AlertItem[]
  expiringItems: AlertItem[]
  usageTrends: UsageTrendData[]
  stats: {
    totalItems: number
    belowParCount: number
    expiringCount: number
    locationCount: number
  }
  userRole: string
}

export function ReportsClient({ belowParItems, expiringItems, usageTrends, stats, userRole }: ReportsClientProps) {
  const [selectedSearchItem, setSelectedSearchItem] = useState<any>(null)

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((item) => Object.values(item).join(","))
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-blue-600">Reports & Analytics</h1>
            </div>
            <GlobalSearch onItemSelect={setSelectedSearchItem} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.belowParCount}</div>
                  <div className="text-sm text-muted-foreground">Below Par</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.expiringCount}</div>
                  <div className="text-sm text-muted-foreground">Expiring Soon</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.locationCount}</div>
                  <div className="text-sm text-muted-foreground">Locations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Search Item */}
        {selectedSearchItem && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Search Result</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSearchItem(null)}
                className="absolute top-4 right-4"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedSearchItem.name}</h3>
                  {selectedSearchItem.description && (
                    <p className="text-muted-foreground">{selectedSearchItem.description}</p>
                  )}
                  <div className="mt-2 text-sm">
                    <div>
                      Location: <span className="font-medium">{selectedSearchItem.storage_path}</span>
                    </div>
                    <div>
                      Stock:{" "}
                      <span className="font-medium">
                        {selectedSearchItem.quantity} {selectedSearchItem.unit_of_measure}
                      </span>
                    </div>
                    <div>
                      Par Level:{" "}
                      <span className="font-medium">
                        {selectedSearchItem.min_par_level} {selectedSearchItem.unit_of_measure}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="trends">Usage Trends</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <AlertsSummary belowParItems={belowParItems} expiringItems={expiringItems} />
          </TabsContent>

          <TabsContent value="trends">
            <UsageTrendsChart data={usageTrends} />
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>Download reports as CSV files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(belowParItems, "below-par-items")}
                    disabled={belowParItems.length === 0}
                    className="justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Below Par Items ({belowParItems.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(expiringItems, "expiring-items")}
                    disabled={expiringItems.length === 0}
                    className="justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Expiring Items ({expiringItems.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(usageTrends, "usage-trends")}
                    disabled={usageTrends.length === 0}
                    className="justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Usage Trends ({usageTrends.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
