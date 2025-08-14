import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar, Filter } from "lucide-react"

export function ReportsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Comprehensive insights into your emergency services operations</p>
      </div>
      <div className="flex items-center space-x-2">
        <Select>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Custom Range
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  )
}
