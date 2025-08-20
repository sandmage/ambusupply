import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsersClient } from "./users-client"

export default async function UsersPage() {
  const supabase = createServerClient()

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const userProfile = profile || {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name || "Unknown User",
    role: user.user_metadata?.role || "staff",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Only admins can access user management
  if (userProfile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all users and profiles
  let users: any[] = []
  let userStats = {
    total: 0,
    admins: 0,
    staff: 0,
    pending: 0,
  }

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profiles) {
      users = profiles
      userStats = {
        total: profiles.length,
        admins: profiles.filter((p) => p.role === "admin").length,
        staff: profiles.filter((p) => p.role === "staff").length,
        pending: profiles.filter((p) => p.role === "pending").length,
      }
    }

    // If no profiles exist, create one for the current user
    if (profiles && profiles.length === 0) {
      const { data: newProfile } = await supabase.from("profiles").insert([userProfile]).select().single()

      if (newProfile) {
        users = [newProfile]
        userStats = {
          total: 1,
          admins: newProfile.role === "admin" ? 1 : 0,
          staff: newProfile.role === "staff" ? 1 : 0,
          pending: newProfile.role === "pending" ? 1 : 0,
        }
      }
    }
  } catch (error) {
    console.error("Error fetching users:", error)
  }

  return <UsersClient users={users} userStats={userStats} currentUser={userProfile} />
}
