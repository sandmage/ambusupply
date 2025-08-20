"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

interface UsageTrendData {
  item_name: string
  total_used: number
  avg_daily_usage: number
  location_name: string
  transaction_count: number
}

interface UsageTrendsChartProps {
  data: UsageTrendData[]
  title?: string
  description?: string
}

export function UsageTrendsChart({
  data,
  title = "Usage Trends Analysis",
  description = "Most frequently used items with detailed metrics",
}: UsageTrendsChartProps) {
  const chartData = data.slice(0, 12).map((item) => ({
    name: item.item_name.length > 15 ? `${item.item_name.substring(0, 15)}...` : item.item_name,
    fullName: item.item_name,
    totalUsed: item.total_used,
    avgDaily: Number(item.avg_daily_usage.toFixed(2)),
    transactions: item.transaction_count,
    location: item.location_name,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card p-4 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              <span className="text-primary">📍</span> {data.location}
            </p>
            <p className="text-muted-foreground">
              <span className="text-secondary">📦</span> Total Used:{" "}
              <span className="font-medium text-foreground">{data.totalUsed}</span>
            </p>
            <p className="text-muted-foreground">
              <span className="text-orange-500">📊</span> Daily Average:{" "}
              <span className="font-medium text-foreground">{data.avgDaily}</span>
            </p>
            <p className="text-muted-foreground">
              <span className="text-purple-500">🔄</span> Transactions:{" "}
              <span className="font-medium text-foreground">{data.transactions}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 medical-heading">
              <TrendingUp className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {data.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {data.reduce((sum, item) => sum + item.total_used, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Items Used</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalUsed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Used" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{data.length}</div>
                <div className="text-sm text-muted-foreground">Items with Usage</div>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {(data.reduce((sum, item) => sum + item.avg_daily_usage, 0) / Math.max(data.length, 1)).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Daily Usage</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {data.reduce((sum, item) => sum + item.transaction_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No usage data available</p>
            <p className="text-sm">Start using inventory items to see usage trends</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
