import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

export function FleetFilters() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Filters</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Location</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="base">Base Station</SelectItem>
              <SelectItem value="downtown">Downtown</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="service">Service Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Vehicle Type</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="basic">Basic Life Support</SelectItem>
              <SelectItem value="advanced">Advanced Life Support</SelectItem>
              <SelectItem value="critical">Critical Care</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full bg-transparent">
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
