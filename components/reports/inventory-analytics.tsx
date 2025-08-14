import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts"
import { Package, TrendingDown } from "lucide-react"

export function InventoryAnalytics() {
  const categoryData = [
    { name: "Medications", value: 35, color: "#0088FE" },
    { name: "Equipment", value: 25, color: "#00C49F" },
    { name: "Consumables", value: 30, color: "#FFBB28" },
    { name: "Emergency", value: 10, color: "#FF8042" },
  ]

  const stockTrendData = [
    { month: "Jan", stock: 1200, usage: 180 },
    { month: "Feb", stock: 1150, usage: 220 },
    { month: "Mar", stock: 1300, usage: 195 },
    { month: "Apr", stock: 1250, usage: 210 },
    { month: "May", stock: 1180, usage: 240 },
    { month: "Jun", stock: 1247, usage: 205 },
  ]

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Inventory by Category</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <ChartContainer
            config={{
              medications: { label: "Medications", color: "#0088FE" },
              equipment: { label: "Equipment", color: "#00C49F" },
              consumables: { label: "Consumables", color: "#FFBB28" },
              emergency: { label: "Emergency", color: "#FF8042" },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-muted-foreground truncate">{item.name}</span>
                <span className="text-sm font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5" />
            <span>Stock Levels & Usage</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <ChartContainer
            config={{
              stock: {
                label: "Stock Level",
                color: "hsl(var(--chart-1))",
              },
              usage: {
                label: "Monthly Usage",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="stock"
                  stackId="1"
                  stroke="var(--color-stock)"
                  fill="var(--color-stock)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="usage"
                  stackId="2"
                  stroke="var(--color-usage)"
                  fill="var(--color-usage)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
