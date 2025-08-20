"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Search, Shield, Clock } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
}

interface UserStats {
  total: number
  admins: number
  staff: number
  pending: number
}

interface UsersClientProps {
  users: User[]
  userStats: UserStats
  currentUser: User
}

export function UsersClient({ users: initialUsers, userStats: initialStats, currentUser }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [userStats, setUserStats] = useState<UserStats>(initialStats)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-accent/20 text-accent-foreground"
      case "staff":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      // Update local state
      const updatedUsers = users.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      setUsers(updatedUsers)

      // Update stats
      const newStats = {
        total: updatedUsers.length,
        admins: updatedUsers.filter((u) => u.role === "admin").length,
        staff: updatedUsers.filter((u) => u.role === "staff").length,
        pending: updatedUsers.filter((u) => u.role === "pending").length,
      }
      setUserStats(newStats)
    } catch (error) {
      console.error("Error updating user role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{userStats.total}</p>
          <p className="text-sm text-muted-foreground">Active accounts</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-accent" />
            <h3 className="font-medium">Administrators</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{userStats.admins}</p>
          <p className="text-sm text-muted-foreground">Admin users</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <h3 className="font-medium">Pending</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{userStats.pending}</p>
          <p className="text-sm text-muted-foreground">Awaiting approval</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">System Users</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{getInitials(user.full_name)}</span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.full_name}
                        {user.id === currentUser.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    {user.id !== currentUser.id && (
                      <div className="flex space-x-1">
                        {user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserRole(user.id, "admin")}
                            disabled={isLoading}
                          >
                            Make Admin
                          </Button>
                        )}
                        {user.role !== "staff" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserRole(user.id, "staff")}
                            disabled={isLoading}
                          >
                            Make Staff
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
