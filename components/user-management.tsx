"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Trash2, UserPlus, Shield, User, Search, Filter } from "lucide-react"
import { format } from "date-fns"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: "admin" | "staff"
  created_at: string
  updated_at: string
}

interface UserManagementProps {
  users: UserProfile[]
  currentUserId: string
}

export function UserManagement({ users: initialUsers, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff">("all")
  const router = useRouter()
  const supabase = createClient()

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: "admin" | "staff") => {
    if (userId === currentUserId) {
      alert("You cannot change your own role")
      return
    }

    setIsLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (!error) {
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
      } else {
        alert("Failed to update user role. Please try again.")
      }
    } catch (error) {
      alert("Failed to update user role. Please try again.")
    } finally {
      setIsLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account")
      return
    }

    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setIsLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId)

      if (!error) {
        setUsers((prev) => prev.filter((user) => user.id !== userId))
      } else {
        alert("Failed to delete user. Please try again.")
      }
    } catch (error) {
      alert("Failed to delete user. Please try again.")
    } finally {
      setIsLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge className="bg-primary text-primary-foreground">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary">
        <User className="h-3 w-3 mr-1" />
        Staff
      </Badge>
    )
  }

  const adminCount = users.filter((u) => u.role === "admin").length
  const staffCount = users.filter((u) => u.role === "staff").length

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 medical-heading">
              <UserPlus className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions • {adminCount} admins, {staffCount} staff
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredUsers.length} of {users.length} users
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value: "all" | "admin" | "staff") => setRoleFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">User Information</TableHead>
                <TableHead className="font-semibold">Role & Permissions</TableHead>
                <TableHead className="font-semibold">Account Created</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.full_name || "No name set"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Current User
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(user.role)}
                      {user.id !== currentUserId && (
                        <Select
                          value={user.role}
                          onValueChange={(value: "admin" | "staff") => handleRoleChange(user.id, value)}
                          disabled={isLoading[user.id]}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{format(new Date(user.created_at), "MMM dd, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(user.created_at), "h:mm a")}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUserId ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isLoading[user.id]}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No users found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
