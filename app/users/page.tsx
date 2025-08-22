import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersClient } from "./users-client"
import { AppLayout } from "@/components/app-layout"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
  organization_id?: string
}

interface UserStats {
  total: number
  admins: number
  staff: number
  pending: number
}

export default async function UsersPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  let userProfile: UserProfile
  try {
    // Check if user record exists in users_sync table
    const { data: userRecord } = await supabase
      .schema("neon_auth")
      .from("users_sync")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    // Create user profile object
    userProfile = {
      id: user.id,
      email: user.email || "",
      full_name: userRecord?.name || user.user_metadata?.full_name || "Unknown User",
      role: user.user_metadata?.role || "admin", // Default to admin for now
      created_at: userRecord?.created_at || new Date().toISOString(),
      updated_at: userRecord?.updated_at || new Date().toISOString(),
      organization_id: user.user_metadata?.organization_id,
    }

    // Create user record if it doesn't exist
    if (!userRecord) {
      await supabase
        .schema("neon_auth")
        .from("users_sync")
        .insert([
          {
            id: user.id,
            email: user.email,
            name: userProfile.full_name,
            raw_json: user.user_metadata || {},
          },
        ])
    }
  } catch (error) {
    console.error("Error managing user record:", error)
    // Fallback user profile
    userProfile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "Unknown User",
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  if (userProfile.role !== "admin") {
    redirect("/dashboard")
  }

  let users: UserProfile[] = []
  let userStats: UserStats = { total: 0, admins: 0, staff: 0, pending: 0 }

  try {
    const { data: usersData, error } = await supabase
      .schema("neon_auth")
      .from("users_sync")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (!error && usersData) {
      users = usersData.map((userRecord) => ({
        id: userRecord.id,
        email: userRecord.email || "",
        full_name: userRecord.name || "Unknown User",
        role: "admin", // Default role - can be enhanced with proper role management
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at,
        organization_id: userRecord.raw_json?.organization_id,
      }))

      userStats = {
        total: users.length,
        admins: users.filter((u) => u.role === "admin").length,
        staff: users.filter((u) => u.role === "staff").length,
        pending: users.filter((u) => u.role === "pending").length,
      }
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    // Users array remains empty, stats remain at zero
  }

  return (
    <AppLayout user={userProfile}>
      <UsersClient users={users} userStats={userStats} currentUser={userProfile} />
    </AppLayout>
  )
}
