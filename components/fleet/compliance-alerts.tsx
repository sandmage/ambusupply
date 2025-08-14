"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, Calendar, Shield, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export function ComplianceAlerts() {
  const router = useRouter()

  const complianceIssues = [
    {
      vehicleId: "AMB-007",
      type: "Registration",
      issue: "Registration Expired",
      daysOverdue: 30,
      severity: "critical",
      dueDate: "2024-02-15",
    },
    {
      vehicleId: "AMB-003",
      type: "Insurance",
      issue: "Insurance Expiring Soon",
      daysUntil: 15,
      severity: "warning",
      dueDate: "2024-04-05",
    },
    {
      vehicleId: "AMB-012",
      type: "Inspection",
      issue: "DOT Inspection Due",
      daysUntil: 7,
      severity: "warning",
      dueDate: "2024-03-27",
    },
    {
      vehicleId: "AMB-015",
      type: "Daily Check",
      issue: "Daily Check Overdue",
      daysOverdue: 2,
      severity: "medium",
      dueDate: "2024-03-18",
    },
  ]

  const complianceStats = {
    totalVehicles: 24,
    compliant: 18,
    warnings: 4,
    critical: 2,
    documentsExpiring: 6,
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Registration":
        return <FileText className="h-4 w-4" />
      case "Insurance":
        return <Shield className="h-4 w-4" />
      case "Inspection":
        return <Calendar className="h-4 w-4" />
      case "Daily Check":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleViewDocuments = () => {
    router.push("/fleet/documents")
  }

  const handleViewDailyChecks = () => {
    router.push("/fleet/daily-checks")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Compliance Alerts</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewDocuments}>
            Manage
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{complianceStats.compliant}</div>
            <div className="text-sm text-muted-foreground">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{complianceStats.critical}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Active Alerts</div>
          <div className="space-y-2">
            {complianceIssues.slice(0, 4).map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(issue.type)}
                  <div>
                    <div className="font-medium text-sm">{issue.vehicleId}</div>
                    <div className="text-xs text-muted-foreground">{issue.issue}</div>
                  </div>
                </div>
                <div className="text-right">
                  {getSeverityBadge(issue.severity)}
                  <div className="text-xs text-muted-foreground mt-1">
                    {issue.daysOverdue ? (
                      <span className="text-red-600">{issue.daysOverdue}d overdue</span>
                    ) : (
                      <span>{issue.daysUntil}d remaining</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Quick Actions</div>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" size="sm" className="justify-start bg-transparent" onClick={handleViewDocuments}>
              <FileText className="h-4 w-4 mr-2" />
              Review Documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start bg-transparent"
              onClick={handleViewDailyChecks}
            >
              <Clock className="h-4 w-4 mr-2" />
              Daily Check Status
            </Button>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Fleet Compliance Score</span>
            <span className="text-lg font-bold text-green-600">
              {Math.round((complianceStats.compliant / complianceStats.totalVehicles) * 100)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {complianceStats.compliant} of {complianceStats.totalVehicles} vehicles fully compliant
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
