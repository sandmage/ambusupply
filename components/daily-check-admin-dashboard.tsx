"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Filter,
  Search,
  Download,
  FileText,
  Car,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  XCircle,
  Settings,
  BarChart3,
} from "lucide-react"

interface DailyCheckSubmission {
  id: string
  form_id: string
  vehicle_id: string
  submission_date: string
  shift_start_time?: string
  shift_end_time?: string
  pre_trip_mileage?: number
  post_trip_mileage?: number
  checklist_responses: Record<string, any>
  issues_found: string[]
  overall_status: "pass" | "fail" | "conditional"
  notes?: string
  submitted_by?: string
  submitted_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  form?: { name: string }
  vehicle?: { vehicle_number: string; make: string; model: string }
  submitted_by_profile?: { first_name: string; last_name: string }
  reviewed_by_profile?: { first_name: string; last_name: string }
}

interface DailyCheckIssue {
  id: string
  submission_id: string
  checklist_item_id: string
  issue_type: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  photo_urls?: string[]
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
}

interface DashboardStats {
  totalSubmissions: number
  pendingReview: number
  passRate: number
  criticalIssues: number
  avgCompletionTime: number
  topIssues: Array<{ issue: string; count: number }>
}

export function DailyCheckAdminDashboard() {
  const [submissions, setSubmissions] = useState<DailyCheckSubmission[]>([])
  const [issues, setIssues] = useState<DailyCheckIssue[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<DailyCheckSubmission | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    vehicle: "",
    reviewer: "all",
  })
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    try {
      // Build query with filters
      let query = supabase.from("daily_check_submissions").select(`
        *,
        form:daily_check_forms(name),
        vehicle:vehicles(vehicle_number, make, model),
        submitted_by_profile:profiles(first_name, last_name),
        reviewed_by_profile:profiles(first_name, last_name)
      `)

      if (filters.status !== "all") {
        if (filters.status === "reviewed") {
          query = query.not("reviewed_at", "is", null)
        } else if (filters.status === "pending") {
          query = query.is("reviewed_at", null)
        } else {
          query = query.eq("overall_status", filters.status)
        }
      }

      if (filters.dateFrom) {
        query = query.gte("submission_date", filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte("submission_date", filters.dateTo)
      }

      if (filters.vehicle) {
        query = query.eq("vehicle_id", filters.vehicle)
      }

      const { data: submissionsData } = await query.order("submitted_at", { ascending: false }).limit(100)

      // Fetch issues for critical analysis
      const { data: issuesData } = await supabase
        .from("daily_check_issues")
        .select("*")
        .order("created_at", { ascending: false })

      setSubmissions(submissionsData || [])
      setIssues(issuesData || [])

      // Calculate dashboard stats
      if (submissionsData) {
        calculateStats(submissionsData, issuesData || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (submissions: DailyCheckSubmission[], issues: DailyCheckIssue[]) => {
    const totalSubmissions = submissions.length
    const pendingReview = submissions.filter((s) => !s.reviewed_at).length
    const passedSubmissions = submissions.filter((s) => s.overall_status === "pass").length
    const passRate = totalSubmissions > 0 ? (passedSubmissions / totalSubmissions) * 100 : 0
    const criticalIssues = issues.filter((i) => i.severity === "critical" && !i.resolved).length

    // Calculate average completion time (mock data for now)
    const avgCompletionTime = 15 // minutes

    // Top issues analysis
    const issueDescriptions = issues.map((i) => i.description)
    const issueCounts = issueDescriptions.reduce(
      (acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const topIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }))

    setStats({
      totalSubmissions,
      pendingReview,
      passRate,
      criticalIssues,
      avgCompletionTime,
      topIssues,
    })
  }

  const handleReviewSubmission = async (approved: boolean) => {
    if (!selectedSubmission) return

    try {
      const { error } = await supabase
        .from("daily_check_submissions")
        .update({
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      setShowReviewDialog(false)
      setSelectedSubmission(null)
      setReviewNotes("")
      fetchData()
    } catch (error) {
      console.error("Error reviewing submission:", error)
    }
  }

  const handleResolveIssue = async (issueId: string, resolutionNotes: string) => {
    try {
      const { error } = await supabase
        .from("daily_check_issues")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq("id", issueId)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error("Error resolving issue:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "conditional":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.vehicle?.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.form?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${submission.submitted_by_profile?.first_name} ${submission.submitted_by_profile?.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Daily Check Admin Dashboard</h2>
          <p className="text-muted-foreground">Review and manage daily vehicle inspection submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReview}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
              <Progress value={stats.passRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.criticalIssues}</div>
              <p className="text-xs text-muted-foreground">Unresolved</p>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCompletionTime}m</div>
              <p className="text-xs text-muted-foreground">Per inspection</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="submissions" className="rounded-xl">
            Submissions
          </TabsTrigger>
          <TabsTrigger value="issues" className="rounded-xl">
            Issues
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {/* Filters */}
          <Card className="apple-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="pass">Passed</SelectItem>
                    <SelectItem value="fail">Failed</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="rounded-xl"
                />

                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="rounded-xl"
                />

                <Select value={filters.reviewer} onValueChange={(value) => setFilters({ ...filters, reviewer: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviewers</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setFilters({ status: "all", dateFrom: "", dateTo: "", vehicle: "", reviewer: "all" })}
                  className="rounded-xl bg-transparent"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="apple-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.overall_status)}
                        <div>
                          <h4 className="font-medium">
                            {submission.vehicle?.vehicle_number} - {submission.form?.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {submission.submitted_by_profile?.first_name} {submission.submitted_by_profile?.last_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {submission.vehicle?.make} {submission.vehicle?.model}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {submission.issues_found?.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {submission.issues_found.length} Issues
                        </Badge>
                      )}

                      <Badge
                        variant={
                          submission.overall_status === "pass"
                            ? "secondary"
                            : submission.overall_status === "fail"
                              ? "destructive"
                              : "default"
                        }
                        className="capitalize"
                      >
                        {submission.overall_status}
                      </Badge>

                      {!submission.reviewed_at && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Pending Review
                        </Badge>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setShowReviewDialog(true)
                        }}
                        className="rounded-lg bg-transparent"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>

                  {submission.issues_found?.length > 0 && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Issues found: {submission.issues_found.slice(0, 2).join(", ")}
                        {submission.issues_found.length > 2 && ` and ${submission.issues_found.length - 2} more...`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {submission.reviewed_at && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Reviewed by {submission.reviewed_by_profile?.first_name}{" "}
                          {submission.reviewed_by_profile?.last_name} on{" "}
                          {new Date(submission.reviewed_at).toLocaleDateString()}
                        </span>
                        <CheckSquare className="h-4 w-4 text-green-500" />
                      </div>
                      {submission.review_notes && (
                        <p className="text-sm mt-1 text-muted-foreground">{submission.review_notes}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredSubmissions.length === 0 && (
              <Card className="apple-card">
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No submissions found</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="space-y-3">
            {issues
              .filter((issue) => !issue.resolved)
              .map((issue) => (
                <Card key={issue.id} className="apple-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <h4 className="font-medium">{issue.description}</h4>
                          <p className="text-sm text-muted-foreground">Issue Type: {issue.issue_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getSeverityColor(issue.severity)} capitalize`}>
                          {issue.severity}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveIssue(issue.id, "Resolved by admin")}
                          className="rounded-lg bg-transparent"
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="apple-card">
                <CardHeader>
                  <CardTitle>Top Issues</CardTitle>
                  <CardDescription>Most frequently reported problems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topIssues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{issue.issue}</span>
                        <Badge variant="outline">{issue.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="apple-card">
                <CardHeader>
                  <CardTitle>Submission Trends</CardTitle>
                  <CardDescription>Daily check completion over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>Create detailed reports for management and compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="rounded-xl bg-transparent h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Daily Summary
                </Button>
                <Button variant="outline" className="rounded-xl bg-transparent h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Monthly Analytics
                </Button>
                <Button variant="outline" className="rounded-xl bg-transparent h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  Issue Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Daily Check Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Vehicle</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.vehicle?.vehicle_number} - {selectedSubmission.vehicle?.make}{" "}
                    {selectedSubmission.vehicle?.model}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted By</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.submitted_by_profile?.first_name}{" "}
                    {selectedSubmission.submitted_by_profile?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedSubmission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedSubmission.overall_status)}
                    <span className="text-sm capitalize">{selectedSubmission.overall_status}</span>
                  </div>
                </div>
              </div>

              {/* Checklist Responses */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Checklist Responses</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(selectedSubmission.checklist_responses).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{key}</span>
                      <span className="text-sm font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues Found */}
              {selectedSubmission.issues_found?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Issues Found</Label>
                  <div className="space-y-2">
                    {selectedSubmission.issues_found.map((issue, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSubmission.notes && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Additional Notes</Label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">{selectedSubmission.notes}</p>
                </div>
              )}

              {/* Review Notes */}
              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your review comments..."
                  className="apple-input min-h-[100px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={() => handleReviewSubmission(true)} className="apple-button flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Mark Reviewed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  className="flex-1 rounded-xl bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
