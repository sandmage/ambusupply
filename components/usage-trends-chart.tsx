"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface UsageTrendData {
  item_name: string
  total_used: number
  avg_daily_usage: number
  location_name: string
}

interface UsageTrendsChartProps {
  data: UsageTrendData[]
  title?: string
  description?: string
}

export function UsageTrendsChart({
  data,
  title = "Usage Trends",
  description = "Most used items in the last 30 days",
}: UsageTrendsChartProps) {
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.item_name.length > 20 ? `${item.item_name.substring(0, 20)}...` : item.item_name,
    fullName: item.item_name,
    totalUsed: item.total_used,
    avgDaily: Number(item.avg_daily_usage.toFixed(1)),
    location: item.location_name,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.location}</p>
          <p className="text-sm">
            Total Used: <span className="font-medium">{data.totalUsed}</span>
          </p>
          <p className="text-sm">
            Avg Daily: <span className="font-medium">{data.avgDaily}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalUsed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No usage data available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
