"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, Calendar, Clock, FileText, Truck } from "lucide-react"

export function DailyChecksAnalytics() {
  // Mock data for daily checks
  const dailyChecks = [
    {
      id: "DC-001",
      vehicleId: "AMB-001",
      vehicleName: "Ambulance Alpha",
      date: "2024-01-15",
      time: "08:30 AM",
      inspector: "John Smith",
      status: "passed",
      totalItems: 45,
      passedItems: 45,
      failedItems: 0,
      issues: [],
    },
    {
      id: "DC-002",
      vehicleId: "AMB-002",
      vehicleName: "Ambulance Beta",
      date: "2024-01-15",
      time: "09:15 AM",
      inspector: "Sarah Johnson",
      status: "failed",
      totalItems: 45,
      passedItems: 42,
      failedItems: 3,
      issues: [
        { category: "Medical Equipment", item: "Oxygen Tank (15L)", issue: "Low pressure reading" },
        { category: "Vehicle Exterior", item: "Left Headlight", issue: "Cracked lens" },
        { category: "Medical Supplies", item: "IV Bags", issue: "Expired - replace needed" },
      ],
    },
    {
      id: "DC-003",
      vehicleId: "AMB-003",
      vehicleName: "Ambulance Gamma",
      date: "2024-01-15",
      time: "10:00 AM",
      inspector: "Mike Wilson",
      status: "warning",
      totalItems: 45,
      passedItems: 44,
      failedItems: 1,
      issues: [{ category: "Medical Equipment", item: "Cardiac Monitor", issue: "Battery low - needs charging" }],
    },
    {
      id: "DC-004",
      vehicleId: "AMB-004",
      vehicleName: "Ambulance Delta",
      date: "2024-01-14",
      time: "07:45 AM",
      inspector: "Lisa Chen",
      status: "passed",
      totalItems: 45,
      passedItems: 45,
      failedItems: 0,
      issues: [],
    },
  ]

  const stats = {
    totalChecks: dailyChecks.length,
    passedChecks: dailyChecks.filter((check) => check.status === "passed").length,
    failedChecks: dailyChecks.filter((check) => check.status === "failed").length,
    warningChecks: dailyChecks.filter((check) => check.status === "warning").length,
    completionRate: Math.round(
      (dailyChecks.filter((check) => check.status === "passed").length / dailyChecks.length) * 100,
    ),
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Passed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      case "warning":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Warning</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Daily Vehicle Checks</CardTitle>
            <CardDescription className="text-gray-600">
              Completed daily inspections and compliance status
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">Passed</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.passedChecks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Failed</p>
                <p className="text-2xl font-bold text-red-900">{stats.failedChecks}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Warnings</p>
                <p className="text-2xl font-bold text-amber-900">{stats.warningChecks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-900">{stats.completionRate}%</p>
              </div>
              <div className="w-8 h-8 flex items-center justify-center">
                <Progress value={stats.completionRate} className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Daily Checks */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Daily Checks</h3>
          <div className="space-y-4">
            {dailyChecks.map((check) => (
              <div key={check.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{check.vehicleName}</h4>
                      <p className="text-sm text-gray-600">{check.vehicleId}</p>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{check.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{check.time}</span>
                  </div>
                  <div className="text-sm text-gray-600">Inspector: {check.inspector}</div>
                  <div className="text-sm text-gray-600">
                    {check.passedItems}/{check.totalItems} items passed
                  </div>
                </div>

                {check.issues.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <h5 className="text-sm font-medium text-red-800 mb-2">Issues Found:</h5>
                    <div className="space-y-1">
                      {check.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-700">
                          <span className="font-medium">
                            {issue.category} - {issue.item}:
                          </span>{" "}
                          {issue.issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <Progress value={(check.passedItems / check.totalItems) * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    Completion: {Math.round((check.passedItems / check.totalItems) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
