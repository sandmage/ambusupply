"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus, Shield, User } from "lucide-react"
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
  const router = useRouter()
  const supabase = createClient()

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
        console.error("Error updating user role:", error)
      }
    } catch (error) {
      console.error("Error updating user role:", error)
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
      // Note: In a real application, you would need to handle user deletion through Supabase Auth
      // This is a simplified example
      const { error } = await supabase.from("profiles").delete().eq("id", userId)

      if (!error) {
        setUsers((prev) => prev.filter((user) => user.id !== userId))
      } else {
        console.error("Error deleting user:", error)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge variant="default" className="bg-blue-600">
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>Manage user accounts and permissions ({users.length} users)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.full_name || "No name"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="text-xs mt-1">
                        You
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    {user.id !== currentUserId && (
                      <Select
                        value={user.role}
                        onValueChange={(value: "admin" | "staff") => handleRoleChange(user.id, value)}
                        disabled={isLoading[user.id]}
                      >
                        <SelectTrigger className="w-24 h-8">
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
                  <div className="text-sm">{format(new Date(user.created_at), "MMM dd, yyyy")}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isLoading[user.id]}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
