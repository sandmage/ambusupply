import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Award, CheckCircle } from "lucide-react"

export function PerformanceMetrics() {
  const metrics = [
    {
      title: "Response Time Target",
      current: 8.2,
      target: 10,
      unit: "minutes",
      status: "good",
      progress: 82,
    },
    {
      title: "Fleet Availability",
      current: 78,
      target: 85,
      unit: "%",
      status: "warning",
      progress: 78,
    },
    {
      title: "Order Fulfillment",
      current: 95,
      target: 90,
      unit: "%",
      status: "excellent",
      progress: 95,
    },
    {
      title: "Cost Efficiency",
      current: 87,
      target: 80,
      unit: "%",
      status: "good",
      progress: 87,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
      case "warning":
        return <Badge className="bg-orange-100 text-orange-800">Needs Attention</Badge>
      case "poor":
        return <Badge className="bg-red-100 text-red-800">Poor</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500"
      case "good":
        return "bg-blue-500"
      case "warning":
        return "bg-orange-500"
      case "poor":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Performance Targets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{metric.title}</span>
                    {getStatusBadge(metric.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.current}
                    {metric.unit} / {metric.target}
                    {metric.unit}
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={metric.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Current: {metric.current}
                      {metric.unit}
                    </span>
                    <span>
                      Target: {metric.target}
                      {metric.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Key Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Response Time Improved</div>
                <div className="text-xs text-muted-foreground">12% improvement over last quarter</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Award className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Cost Reduction</div>
                <div className="text-xs text-muted-foreground">8% reduction in monthly spending</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Fleet Efficiency</div>
                <div className="text-xs text-muted-foreground">Increased utilization by 15%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
