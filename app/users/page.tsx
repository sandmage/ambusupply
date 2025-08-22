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
  console.log("[v0] Users page: Starting server-side rendering")

  const supabase = await createServerClient()
  console.log("[v0] Users page: Supabase client created")

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log("[v0] Users page: Auth check result:", { user: user?.id, error: userError })

  if (userError || !user) {
    console.log("[v0] Users page: No authenticated user, redirecting to login")
    redirect("/auth/login")
  }

  console.log("[v0] Users page: User authenticated:", user.id)

  let userProfile: UserProfile
  try {
    console.log("[v0] Users page: Checking for existing user record")
    // Check if user record exists in users_sync table
    const { data: userRecord, error: userRecordError } = await supabase
      .schema("neon_auth")
      .from("users_sync")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    console.log("[v0] Users page: User record query result:", {
      found: !!userRecord,
      error: userRecordError,
      record: userRecord,
    })

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

    console.log("[v0] Users page: User profile created:", userProfile)

    // Create user record if it doesn't exist
    if (!userRecord) {
      console.log("[v0] Users page: Creating new user record")
      const { error: insertError } = await supabase
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

      console.log("[v0] Users page: User record creation result:", { error: insertError })
    }
  } catch (error) {
    console.error("[v0] Users page: Error managing user record:", error)
    // Fallback user profile
    userProfile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "Unknown User",
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    console.log("[v0] Users page: Using fallback user profile:", userProfile)
  }

  if (userProfile.role !== "admin") {
    console.log("[v0] Users page: User is not admin, redirecting to dashboard")
    redirect("/dashboard")
  }

  console.log("[v0] Users page: User is admin, proceeding to fetch all users")

  let users: UserProfile[] = []
  let userStats: UserStats = { total: 0, admins: 0, staff: 0, pending: 0 }

  try {
    console.log("[v0] Users page: Fetching all users from database")
    const { data: usersData, error } = await supabase
      .schema("neon_auth")
      .from("users_sync")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    console.log("[v0] Users page: Users query result:", {
      error,
      count: usersData?.length || 0,
      data: usersData,
    })

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

      console.log("[v0] Users page: Mapped users:", users)

      userStats = {
        total: users.length,
        admins: users.filter((u) => u.role === "admin").length,
        staff: users.filter((u) => u.role === "staff").length,
        pending: users.filter((u) => u.role === "pending").length,
      }

      console.log("[v0] Users page: User stats calculated:", userStats)
    } else {
      console.log("[v0] Users page: No users data or error occurred")
    }
  } catch (error) {
    console.error("[v0] Users page: Error fetching users:", error)
    // Users array remains empty, stats remain at zero
  }

  console.log("[v0] Users page: Final data being passed to client:", {
    usersCount: users.length,
    userStats,
    currentUser: userProfile.id,
  })

  return (
    <AppLayout user={userProfile}>
      <UsersClient users={users} userStats={userStats} currentUser={userProfile} />
    </AppLayout>
  )
}
