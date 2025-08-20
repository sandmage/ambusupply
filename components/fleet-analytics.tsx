"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, DollarSign, Clock, Fuel, Wrench, Car, Users, Download } from "lucide-react"

interface AnalyticsData {
  vehicleUtilization: any[]
  maintenanceCosts: any[]
  fuelConsumption: any[]
  driverPerformance: any[]
  monthlyTrends: any[]
}

interface FleetAnalyticsProps {
  dateRange?: { start: string; end: string }
}

export function FleetAnalytics({ dateRange }: FleetAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    vehicleUtilization: [],
    maintenanceCosts: [],
    fuelConsumption: [],
    driverPerformance: [],
    monthlyTrends: [],
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [kpis, setKpis] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    utilizationRate: 0,
    maintenanceCosts: 0,
    fuelCosts: 0,
    avgDowntime: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(selectedPeriod))

      // Fetch vehicles data
      const { data: vehicles } = await supabase.from("vehicles").select("*")

      // Fetch maintenance records
      const { data: maintenance } = await supabase
        .from("maintenance_records")
        .select("*, vehicle:vehicles(vehicle_number)")
        .gte("scheduled_date", startDate.toISOString().split("T")[0])
        .lte("scheduled_date", endDate.toISOString().split("T")[0])

      // Fetch fuel records
      const { data: fuel } = await supabase
        .from("fuel_records")
        .select("*, vehicle:vehicles(vehicle_number)")
        .gte("fueled_at", startDate.toISOString())
        .lte("fueled_at", endDate.toISOString())

      // Fetch assignments
      const { data: assignments } = await supabase
        .from("vehicle_assignments")
        .select("*, vehicle:vehicles(vehicle_number), driver:drivers(first_name, last_name)")
        .gte("assigned_at", startDate.toISOString())

      // Process data for charts
      const processedData = processAnalyticsData(vehicles || [], maintenance || [], fuel || [], assignments || [])
      setAnalyticsData(processedData)

      // Calculate KPIs
      const totalVehicles = vehicles?.length || 0
      const activeVehicles = vehicles?.filter((v) => v.status === "active").length || 0
      const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0
      const maintenanceCosts = maintenance?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0
      const fuelCosts = fuel?.reduce((sum, f) => sum + (f.total_cost || 0), 0) || 0

      setKpis({
        totalVehicles,
        activeVehicles,
        utilizationRate,
        maintenanceCosts,
        fuelCosts,
        avgDowntime: 2.5, // Mock data - would calculate from maintenance records
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (vehicles: any[], maintenance: any[], fuel: any[], assignments: any[]) => {
    // Vehicle Utilization
    const vehicleUtilization = vehicles.map((vehicle) => ({
      name: vehicle.vehicle_number,
      utilization: Math.random() * 100, // Mock data - would calculate from assignments
      assignments: assignments.filter((a) => a.vehicle_id === vehicle.id).length,
    }))

    // Maintenance Costs by Month
    const maintenanceCosts = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })
      const monthCosts = maintenance
        .filter((m) => new Date(m.scheduled_date).getMonth() === date.getMonth())
        .reduce((sum, m) => sum + (m.cost || 0), 0)

      return {
        month: monthName,
        cost: monthCosts,
        count: maintenance.filter((m) => new Date(m.scheduled_date).getMonth() === date.getMonth()).length,
      }
    }).reverse()

    // Fuel Consumption
    const fuelConsumption = fuel.reduce((acc: any[], record) => {
      const vehicleNumber = record.vehicle?.vehicle_number || "Unknown"
      const existing = acc.find((item) => item.vehicle === vehicleNumber)
      if (existing) {
        existing.gallons += record.fuel_amount || 0
        existing.cost += record.total_cost || 0
      } else {
        acc.push({
          vehicle: vehicleNumber,
          gallons: record.fuel_amount || 0,
          cost: record.total_cost || 0,
        })
      }
      return acc
    }, [])

    // Driver Performance
    const driverPerformance = assignments.reduce((acc: any[], assignment) => {
      const driverName = `${assignment.driver?.first_name || ""} ${assignment.driver?.last_name || ""}`.trim()
      const existing = acc.find((item) => item.driver === driverName)
      if (existing) {
        existing.assignments += 1
      } else {
        acc.push({
          driver: driverName || "Unknown",
          assignments: 1,
          efficiency: Math.random() * 100, // Mock data
        })
      }
      return acc
    }, [])

    // Monthly Trends
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      return {
        month: monthName,
        vehicles: Math.floor(Math.random() * 20) + 10, // Mock data
        maintenance: Math.floor(Math.random() * 10) + 5,
        fuel: Math.floor(Math.random() * 5000) + 2000,
      }
    }).reverse()

    return {
      vehicleUtilization,
      maintenanceCosts,
      fuelConsumption,
      driverPerformance,
      monthlyTrends,
    }
  }

  const exportReport = () => {
    // Mock export functionality
    const reportData = {
      period: `${selectedPeriod} days`,
      generated: new Date().toISOString(),
      kpis,
      data: analyticsData,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fleet-analytics-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const chartColors = {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    accent: "hsl(var(--accent))",
    destructive: "hsl(var(--destructive))",
    muted: "hsl(var(--muted-foreground))",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="period">Period:</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={exportReport} variant="outline" className="rounded-xl bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.utilizationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {kpis.activeVehicles} of {kpis.totalVehicles} vehicles active
            </p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
            <Wrench className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.maintenanceCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last {selectedPeriod} days</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Costs</CardTitle>
            <Fuel className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.fuelCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last {selectedPeriod} days</p>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Downtime</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgDowntime} days</div>
            <p className="text-xs text-muted-foreground">Per maintenance event</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="utilization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="utilization" className="rounded-xl">
            Utilization
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-xl">
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="fuel" className="rounded-xl">
            Fuel Analysis
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl">
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="utilization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Vehicle Utilization Rates</CardTitle>
                <CardDescription>Percentage of time each vehicle is in active use</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    utilization: {
                      label: "Utilization %",
                      color: chartColors.primary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.vehicleUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="utilization" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Monthly Fleet Trends</CardTitle>
                <CardDescription>Vehicle activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    vehicles: {
                      label: "Active Vehicles",
                      color: chartColors.primary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="vehicles"
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Maintenance Costs by Month</CardTitle>
                <CardDescription>Monthly maintenance expenditure trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cost: {
                      label: "Cost ($)",
                      color: chartColors.accent,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.maintenanceCosts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cost" fill={chartColors.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Maintenance Frequency</CardTitle>
                <CardDescription>Number of maintenance events per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Events",
                      color: chartColors.secondary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.maintenanceCosts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={chartColors.secondary}
                        strokeWidth={3}
                        dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Fuel Consumption by Vehicle</CardTitle>
                <CardDescription>Gallons consumed per vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    gallons: {
                      label: "Gallons",
                      color: chartColors.secondary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.fuelConsumption}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vehicle" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="gallons" fill={chartColors.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Fuel Costs Distribution</CardTitle>
                <CardDescription>Cost breakdown by vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cost: {
                      label: "Cost ($)",
                      color: chartColors.primary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.fuelConsumption}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill={chartColors.primary}
                        dataKey="cost"
                        label={({ vehicle, cost }) => `${vehicle}: $${cost}`}
                      >
                        {analyticsData.fuelConsumption.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={Object.values(chartColors)[index % Object.values(chartColors).length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Driver Assignment Frequency</CardTitle>
                <CardDescription>Number of assignments per driver</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    assignments: {
                      label: "Assignments",
                      color: chartColors.primary,
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.driverPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="driver" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="assignments" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Fleet Performance Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <span className="font-medium">Fleet Efficiency</span>
                  </div>
                  <Badge variant="secondary" className="rounded-lg">
                    87.5%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-medium">Cost per Mile</span>
                  </div>
                  <Badge variant="outline" className="rounded-lg">
                    $0.45
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="font-medium">Avg Response Time</span>
                  </div>
                  <Badge variant="default" className="rounded-lg">
                    8.2 min
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-secondary" />
                    <span className="font-medium">Driver Satisfaction</span>
                  </div>
                  <Badge variant="secondary" className="rounded-lg">
                    92%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
