"use client"

import { useState } from "react"
import { Download, AlertTriangle, Clock, Package, MapPin, TrendingDown, BarChart3, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GlobalSearch } from "@/components/global-search"
import { AlertsSummary } from "@/components/alerts-summary"
import { UsageTrendsChart } from "@/components/usage-trends-chart"
import { format, subDays, isAfter } from "date-fns"

interface AlertItem {
  id: string
  name: string
  current_quantity: number
  par_level: number
  unit_of_measure: string
  expiration_date?: string
  location_name: string
  storage_unit_name?: string
  description?: string
}

interface UsageTrendData {
  item_name: string
  total_used: number
  avg_daily_usage: number
  location_name: string
  transaction_count: number
}

interface Transaction {
  id: string
  transaction_type: string
  quantity_change: number
  reason: string
  created_at: string
  performed_by: string
  item_id: string
}

interface ReportsClientProps {
  belowParItems: AlertItem[]
  expiringItems: AlertItem[]
  outOfStockItems: AlertItem[]
  usageTrends: UsageTrendData[]
  allItems: AlertItem[]
  transactions: Transaction[]
  stats: {
    totalItems: number
    belowParCount: number
    expiringCount: number
    outOfStockCount: number
    locationCount: number
  }
  userRole: string
}

export function ReportsClient({
  belowParItems,
  expiringItems,
  outOfStockItems,
  usageTrends,
  allItems,
  transactions,
  stats,
  userRole,
}: ReportsClientProps) {
  const [selectedSearchItem, setSelectedSearchItem] = useState<any>(null)
  const [dateRange, setDateRange] = useState("30")
  const [locationFilter, setLocationFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Get unique locations for filtering
  const uniqueLocations = [...new Set(allItems.map((item) => item.location_name))].sort()

  // Filter transactions by date range
  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.created_at)
    const cutoffDate = subDays(new Date(), Number.parseInt(dateRange))
    return isAfter(transactionDate, cutoffDate)
  })

  // Calculate activity metrics
  const totalTransactions = filteredTransactions.length
  const useTransactions = filteredTransactions.filter((t) => t.transaction_type === "use").length
  const restockTransactions = filteredTransactions.filter((t) => t.transaction_type === "restock").length
  const adjustmentTransactions = filteredTransactions.filter((t) => t.transaction_type === "adjustment").length

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((item) =>
      Object.values(item)
        .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
        .join(","),
    )
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAllData = () => {
    const comprehensiveData = allItems.map((item) => ({
      name: item.name,
      description: item.description || "",
      current_quantity: item.current_quantity,
      par_level: item.par_level,
      unit_of_measure: item.unit_of_measure,
      location_name: item.location_name,
      storage_unit_name: item.storage_unit_name || "",
      expiration_date: item.expiration_date || "",
      status:
        item.current_quantity === 0 ? "Out of Stock" : item.current_quantity < item.par_level ? "Below Par" : "Normal",
    }))
    exportToCSV(comprehensiveData, "complete-inventory-report")
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground medical-heading">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Comprehensive insights and data analysis for medical supply management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <GlobalSearch onItemSelect={setSelectedSearchItem} />
              <Button
                onClick={exportAllData}
                variant="outline"
                className="hover:bg-primary/10 hover:text-primary bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.totalItems}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Items</div>
                </div>
                <Package className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-destructive">{stats.belowParCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Below Par</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-500">{stats.expiringCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Expiring Soon</div>
                </div>
                <Clock className="h-8 w-8 text-orange-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-destructive">{stats.outOfStockCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Out of Stock</div>
                </div>
                <TrendingDown className="h-8 w-8 text-destructive/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-secondary">{stats.locationCount}</div>
                  <div className="text-sm text-muted-foreground font-medium">Locations</div>
                </div>
                <MapPin className="h-8 w-8 text-secondary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedSearchItem && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-primary">Search Result Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSearchItem(null)} className="h-8 w-8 p-0">
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{selectedSearchItem.name}</h3>
                  {selectedSearchItem.description && (
                    <p className="text-muted-foreground mb-3">{selectedSearchItem.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedSearchItem.storage_path}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Current Stock:{" "}
                        <span className="font-medium">
                          {selectedSearchItem.quantity} {selectedSearchItem.unit_of_measure}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Par Level:{" "}
                        <span className="font-medium">
                          {selectedSearchItem.min_par_level} {selectedSearchItem.unit_of_measure}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Badge
                    variant={
                      selectedSearchItem.quantity < selectedSearchItem.min_par_level ? "destructive" : "secondary"
                    }
                    className="text-lg px-4 py-2"
                  >
                    {selectedSearchItem.quantity < selectedSearchItem.min_par_level ? "Below Par" : "Normal Stock"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="export">Data Export</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <AlertsSummary
              belowParItems={belowParItems}
              expiringItems={expiringItems}
              outOfStockItems={outOfStockItems}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="medical-heading">Activity Overview</CardTitle>
                      <CardDescription>Transaction summary for the selected period</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-32">
                          <Calendar className="h-4 w-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-2xl font-bold text-primary">{totalTransactions}</div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                    <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                      <div className="text-2xl font-bold text-destructive">{useTransactions}</div>
                      <div className="text-sm text-muted-foreground">Items Used</div>
                    </div>
                    <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                      <div className="text-2xl font-bold text-secondary">{restockTransactions}</div>
                      <div className="text-sm text-muted-foreground">Restocks</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-2xl font-bold text-orange-600">{adjustmentTransactions}</div>
                      <div className="text-sm text-muted-foreground">Adjustments</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <UsageTrendsChart
                data={usageTrends}
                title="Most Used Items"
                description={`Top items by usage in the last ${dateRange} days`}
              />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="medical-heading">Recent Transaction History</CardTitle>
                <CardDescription>Latest inventory movements and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.slice(0, 20).map((transaction) => {
                    const item = allItems.find((i) => i.id === transaction.item_id)
                    return (
                      <div key={transaction.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-shrink-0">
                          {transaction.transaction_type === "use" && (
                            <TrendingDown className="h-5 w-5 text-destructive" />
                          )}
                          {transaction.transaction_type === "restock" && <Package className="h-5 w-5 text-secondary" />}
                          {transaction.transaction_type === "adjustment" && (
                            <BarChart3 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{item?.name || "Unknown Item"}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.reason} • {format(new Date(transaction.created_at), "MMM dd, yyyy h:mm a")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            {transaction.quantity_change > 0 ? "+" : ""}
                            {transaction.quantity_change}
                          </div>
                          <div className="text-xs text-muted-foreground">{transaction.performed_by}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 medical-heading">
                  <Download className="h-5 w-5" />
                  Data Export Center
                </CardTitle>
                <CardDescription>Download comprehensive reports and data sets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(belowParItems, "below-par-items")}
                    disabled={belowParItems.length === 0}
                    className="justify-start h-auto p-4 flex-col items-start hover:bg-destructive/5 hover:border-destructive/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-medium">Below Par Items</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {belowParItems.length} items requiring attention
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(expiringItems, "expiring-items")}
                    disabled={expiringItems.length === 0}
                    className="justify-start h-auto p-4 flex-col items-start hover:bg-orange-50 hover:border-orange-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Expiring Items</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{expiringItems.length} items expiring soon</div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(usageTrends, "usage-trends")}
                    disabled={usageTrends.length === 0}
                    className="justify-start h-auto p-4 flex-col items-start hover:bg-primary/5 hover:border-primary/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span className="font-medium">Usage Analytics</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{usageTrends.length} items with usage data</div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(outOfStockItems, "out-of-stock-items")}
                    disabled={outOfStockItems.length === 0}
                    className="justify-start h-auto p-4 flex-col items-start hover:bg-destructive/5 hover:border-destructive/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      <span className="font-medium">Out of Stock</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{outOfStockItems.length} items out of stock</div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => exportToCSV(filteredTransactions, "transaction-history")}
                    disabled={filteredTransactions.length === 0}
                    className="justify-start h-auto p-4 flex-col items-start hover:bg-secondary/5 hover:border-secondary/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-secondary" />
                      <span className="font-medium">Transaction History</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {filteredTransactions.length} recent transactions
                    </div>
                  </Button>

                  <Button
                    onClick={exportAllData}
                    className="justify-start h-auto p-4 flex-col items-start bg-primary hover:bg-primary/90"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="h-5 w-5" />
                      <span className="font-medium text-primary-foreground">Complete Report</span>
                    </div>
                    <div className="text-sm text-primary-foreground/80">Full inventory with all details</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
