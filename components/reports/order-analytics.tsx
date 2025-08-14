import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { ShoppingCart, DollarSign } from "lucide-react"

export function OrderAnalytics() {
  const orderVolumeData = [
    { month: "Jan", orders: 12, amount: 28500 },
    { month: "Feb", orders: 15, amount: 32100 },
    { month: "Mar", orders: 18, amount: 41200 },
    { month: "Apr", orders: 14, amount: 35800 },
    { month: "May", orders: 22, amount: 48900 },
    { month: "Jun", orders: 19, amount: 45230 },
  ]

  const supplierSpendData = [
    { supplier: "MedSupply", amount: 15200 },
    { supplier: "HealthCare", amount: 12800 },
    { supplier: "CardioTech", amount: 9500 },
    { supplier: "PharmaCorp", amount: 7730 },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Order Volume & Spending</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <ChartContainer
              config={{
                orders: {
                  label: "Orders",
                  color: "hsl(var(--chart-1))",
                },
                amount: {
                  label: "Amount ($)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] w-full max-w-full"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={orderVolumeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId="left" dataKey="orders" fill="var(--color-orders)" radius={4} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-amount)", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Supplier Spending</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-hidden">
            <ChartContainer
              config={{
                amount: {
                  label: "Spending ($)",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[200px] w-full max-w-full"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={supplierSpendData}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis dataKey="supplier" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
