import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersClient } from "./users-client"
import { AppLayout } from "@/components/app-layout"

export default async function UsersPage() {
  console.log("[v0] Users page: Starting server-side rendering")

  const supabase = await createServerClient()
  console.log("[v0] Users page: Supabase client created")

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  console.log("[v0] Users page: Auth check result:", { user: user?.id, error: userError })

  if (userError || !user) {
    console.log("[v0] Users page: No user found, redirecting to login")
    redirect("/auth/login")
  }

  console.log("[v0] Users page: User authenticated, checking database record")

  let userRecord = null
  let userRecordError = null

  try {
    const result = await supabase.schema("neon_auth").from("users_sync").select("*").eq("id", user.id).maybeSingle()
    userRecord = result.data
    userRecordError = result.error
    console.log("[v0] Users page: User record query result:", { data: userRecord, error: userRecordError })
  } catch (error) {
    console.log("[v0] Users page: User record query failed with exception:", error)
    userRecordError = error
  }

  console.log("[v0] Current authenticated user:", {
    id: user.id,
    email: user.email,
    metadata: user.user_metadata,
  })
  console.log("[v0] User record from database:", userRecord)

  const userProfile = userRecord
    ? {
        id: userRecord.id,
        email: userRecord.email || user.email || "",
        full_name: userRecord.name || user.user_metadata?.full_name || "Unknown User",
        role: user.user_metadata?.role || "admin", // Default to admin for now
        created_at: userRecord.created_at || new Date().toISOString(),
        updated_at: userRecord.updated_at || new Date().toISOString(),
      }
    : {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "Unknown User",
        role: user.user_metadata?.role || "admin", // Default to admin for now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

  console.log("[v0] Final user profile:", userProfile)

  // Only admins can access user management
  if (userProfile.role !== "admin") {
    console.log("[v0] Users page: User is not admin, redirecting to dashboard")
    redirect("/dashboard")
  }

  if (!userRecord) {
    try {
      console.log("[v0] Creating new user record:", {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || "Unknown User",
        raw_json: user.user_metadata || {},
      })

      const insertResult = await supabase
        .schema("neon_auth")
        .from("users_sync")
        .insert([
          {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || "Unknown User",
            raw_json: user.user_metadata || {},
          },
        ])

      console.log("[v0] User record insert result:", insertResult)

      if (insertResult.error) {
        console.log("[v0] User record creation failed:", insertResult.error)
      } else {
        console.log("[v0] User record created successfully")
      }
    } catch (error) {
      console.error("[v0] Error creating user record:", error)
    }
  }

  let users: any[] = []
  let userStats = {
    total: 0,
    admins: 0,
    staff: 0,
    pending: 0,
  }

  console.log("[v0] Users page: Starting to fetch all users")

  try {
    console.log("[v0] Users page: Attempting to query users_sync table")

    const usersResult = await supabase
      .schema("neon_auth")
      .from("users_sync")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    console.log("[v0] Users page: Raw query result:", usersResult)
    console.log("[v0] Fetched users from database:", usersResult.data)
    console.log("[v0] Users error:", usersResult.error)

    if (usersResult.error) {
      console.log("[v0] Users page: Database error details:", {
        message: usersResult.error.message,
        details: usersResult.error.details,
        hint: usersResult.error.hint,
        code: usersResult.error.code,
      })
    }

    if (usersResult.data) {
      console.log("[v0] Users page: Processing user data, count:", usersResult.data.length)

      // Map users_sync records to expected profile format
      users = usersResult.data.map((userRecord, index) => {
        console.log(`[v0] Users page: Processing user ${index}:`, userRecord)
        return {
          id: userRecord.id,
          email: userRecord.email,
          full_name: userRecord.name || "Unknown User",
          role: "admin", // Default role for now - can be enhanced later
          created_at: userRecord.created_at,
          updated_at: userRecord.updated_at,
        }
      })

      console.log("[v0] Users page: Mapped users:", users)

      userStats = {
        total: users.length,
        admins: users.filter((p) => p.role === "admin").length,
        staff: users.filter((p) => p.role === "staff").length,
        pending: users.filter((p) => p.role === "pending").length,
      }

      console.log("[v0] Users page: User stats calculated:", userStats)
    } else {
      console.log("[v0] Users page: No user data returned from query")
    }
  } catch (error) {
    console.error("[v0] Users page: Exception during user fetch:", error)
  }

  console.log("[v0] Users page: Final users array:", users)
  console.log("[v0] Users page: Final user stats:", userStats)

  return (
    <AppLayout user={userProfile}>
      <UsersClient users={users} userStats={userStats} currentUser={userProfile} />
    </AppLayout>
  )
}
