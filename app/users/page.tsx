import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersClient } from "./users-client"
import { AppLayout } from "@/components/app-layout"
import { crypto } from "crypto"

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
    const { data: userRecord, error: userRecordError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    console.log("[v0] Users page: User record query result:", {
      found: !!userRecord,
      error: userRecordError,
      record: userRecord,
    })

    const organizationId = userRecord?.organization_id || crypto.randomUUID()

    // Create user profile object
    userProfile = {
      id: user.id,
      email: user.email || "",
      full_name: userRecord?.full_name || user.user_metadata?.full_name || "Unknown User",
      role: userRecord?.role || user.user_metadata?.role || "admin", // Use role from database
      created_at: userRecord?.created_at || new Date().toISOString(),
      updated_at: userRecord?.updated_at || new Date().toISOString(),
      organization_id: organizationId,
    }

    console.log("[v0] Users page: User profile created:", userProfile)

    // Create or update user record
    if (!userRecord) {
      console.log("[v0] Users page: Creating new user record")
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          email: user.email,
          full_name: userProfile.full_name,
          role: userProfile.role,
          organization_id: organizationId,
        },
      ])

      console.log("[v0] Users page: User record creation result:", { error: insertError })
    } else if (!userRecord.organization_id) {
      console.log("[v0] Users page: Updating user record with organization_id")
      const { error: updateError } = await supabase
        .from("users")
        .update({ organization_id: organizationId, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      console.log("[v0] Users page: User record update result:", { error: updateError })
    }
  } catch (error) {
    console.error("[v0] Users page: Error managing user record:", error)
    userProfile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "Unknown User",
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization_id: crypto.randomUUID(), // Generate proper UUID
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
      .from("users")
      .select("*")
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
        full_name: userRecord.full_name || "Unknown User",
        role: userRecord.role || "staff",
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at,
        organization_id: userRecord.organization_id,
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
