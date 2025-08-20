"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Search, TrendingUp, TrendingDown, Package } from "lucide-react"

interface Transaction {
  id: string
  item_name: string
  transaction_type: "use" | "restock" | "transfer" | "adjustment"
  quantity_change: number
  reason: string
  performed_by: string
  created_at: string
  location_name?: string
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          transaction_type,
          quantity_change,
          reason,
          performed_by,
          created_at,
          inventory_items!inner (
            name,
            locations (
              name
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      const transformedTransactions =
        data?.map((t: any) => ({
          id: t.id,
          item_name: t.inventory_items.name,
          transaction_type: t.transaction_type,
          quantity_change: t.quantity_change,
          reason: t.reason,
          performed_by: t.performed_by,
          created_at: t.created_at,
          location_name: t.inventory_items.locations?.name,
        })) || []

      setTransactions(transformedTransactions)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || transaction.transaction_type === filterType

    return matchesSearch && matchesType
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "use":
        return <TrendingDown className="h-4 w-4 text-destructive" />
      case "restock":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4 text-primary" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "use":
        return <Badge variant="destructive">Used</Badge>
      case "restock":
        return <Badge className="bg-green-600 text-white">Restocked</Badge>
      case "transfer":
        return <Badge variant="secondary">Transferred</Badge>
      case "adjustment":
        return <Badge variant="outline">Adjusted</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="apple-card">
        <CardContent className="p-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transaction history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-serif font-bold text-primary">
          <div className="p-2 rounded-xl bg-primary/10">
            <History className="h-6 w-6" />
          </div>
          Transaction History
        </CardTitle>
        <CardDescription className="text-base font-medium">
          Track all inventory movements and changes • {filteredTransactions.length} transactions shown
        </CardDescription>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-border/50 bg-card"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 h-12 rounded-2xl border-border/50 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="use">Used</SelectItem>
              <SelectItem value="restock">Restocked</SelectItem>
              <SelectItem value="transfer">Transferred</SelectItem>
              <SelectItem value="adjustment">Adjusted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-base h-14">Item</TableHead>
                <TableHead className="font-semibold text-base h-14">Type</TableHead>
                <TableHead className="font-semibold text-base h-14">Change</TableHead>
                <TableHead className="font-semibold text-base h-14">Reason</TableHead>
                <TableHead className="font-semibold text-base h-14">Performed By</TableHead>
                <TableHead className="font-semibold text-base h-14">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/20 transition-all duration-200">
                  <TableCell className="py-4">
                    <div className="font-semibold text-foreground">{transaction.item_name}</div>
                    {transaction.location_name && (
                      <div className="text-sm text-muted-foreground">{transaction.location_name}</div>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.transaction_type)}
                      {getTransactionBadge(transaction.transaction_type)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div
                      className={`font-semibold ${transaction.quantity_change > 0 ? "text-green-600" : "text-destructive"}`}
                    >
                      {transaction.quantity_change > 0 ? "+" : ""}
                      {transaction.quantity_change}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-sm text-foreground">{transaction.reason}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-sm text-foreground font-medium">{transaction.performed_by}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="text-sm text-foreground">
                      {format(new Date(transaction.created_at), "MMM dd, yyyy 'at' h:mm a")}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="p-6 rounded-3xl bg-muted/20 inline-flex mb-6">
              <History className="h-12 w-12 opacity-50" />
            </div>
            <p className="text-xl font-serif font-bold mb-2">No transactions found</p>
            <p className="text-base font-medium">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
