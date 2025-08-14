import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Calendar } from "lucide-react"

export function OrdersFilters() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders by ID, supplier, or items..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Select>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              <SelectItem value="medsupply">MedSupply Co.</SelectItem>
              <SelectItem value="healthcare">HealthCare Plus</SelectItem>
              <SelectItem value="cardiotech">CardioTech</SelectItem>
              <SelectItem value="pharmacorp">PharmaCorp</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Active filters:</span>
        <Badge variant="secondary" className="flex items-center gap-1">
          Pending Orders
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          This Month
          <X className="h-3 w-3 cursor-pointer" />
        </Badge>
      </div>
    </div>
  )
}
