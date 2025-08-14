import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { Truck, TrendingUp } from "lucide-react"

export function FleetAnalytics() {
  const utilizationData = [
    { month: "Jan", utilization: 65, deployments: 45 },
    { month: "Feb", utilization: 72, deployments: 52 },
    { month: "Mar", utilization: 68, deployments: 48 },
    { month: "Apr", utilization: 78, deployments: 58 },
    { month: "May", utilization: 82, deployments: 62 },
    { month: "Jun", utilization: 75, deployments: 55 },
  ]

  const responseTimeData = [
    { day: "Mon", avgTime: 7.2 },
    { day: "Tue", avgTime: 8.1 },
    { day: "Wed", avgTime: 6.8 },
    { day: "Thu", avgTime: 9.2 },
    { day: "Fri", avgTime: 8.5 },
    { day: "Sat", avgTime: 7.9 },
    { day: "Sun", avgTime: 7.3 },
  ]

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Fleet Utilization Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <ChartContainer
            config={{
              utilization: {
                label: "Utilization %",
                color: "hsl(var(--chart-1))",
              },
              deployments: {
                label: "Deployments",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="utilization" fill="var(--color-utilization)" radius={4} />
                <Bar dataKey="deployments" fill="var(--color-deployments)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Average Response Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <ChartContainer
            config={{
              avgTime: {
                label: "Response Time (min)",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="var(--color-avgTime)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-avgTime)", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
