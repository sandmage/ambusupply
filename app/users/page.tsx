import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersClient } from "./users-client"
import { AppLayout } from "@/components/app-layout"

export default async function UsersPage() {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: userRecord } = await supabase.from("users_sync").select("*").eq("id", user.id).maybeSingle()

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
      await supabase.from("users_sync").insert([
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || "Unknown User",
          raw_json: user.user_metadata || {},
        },
      ])
      console.log("[v0] User record created successfully")
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

  try {
    // Get all users from users_sync table
    const { data: allUsers, error: usersError } = await supabase
      .from("users_sync")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    console.log("[v0] Fetched users from database:", allUsers)
    console.log("[v0] Users error:", usersError)

    if (allUsers) {
      // Map users_sync records to expected profile format
      users = allUsers.map((userRecord) => ({
        id: userRecord.id,
        email: userRecord.email,
        full_name: userRecord.name || "Unknown User",
        role: "admin", // Default role for now - can be enhanced later
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at,
      }))

      userStats = {
        total: users.length,
        admins: users.filter((p) => p.role === "admin").length,
        staff: users.filter((p) => p.role === "staff").length,
        pending: users.filter((p) => p.role === "pending").length,
      }
    }
  } catch (error) {
    console.error("Error fetching users:", error)
  }

  return (
    <AppLayout user={userProfile}>
      <UsersClient users={users} userStats={userStats} currentUser={userProfile} />
    </AppLayout>
  )
}
