import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { FleetClient } from "./fleet-client"

export default async function FleetPage() {
  try {
    console.log("[v0] Fleet: Starting server-side rendering")
    const supabase = await createServerClient()
    console.log("[v0] Fleet: Server client created successfully")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    console.log("[v0] Fleet: Auth check result:", { user: user?.id, error: userError })

    if (userError || !user) {
      console.log("[v0] Fleet: Redirecting to login due to auth failure")
      redirect("/auth/login")
    }

    console.log("[v0] Fleet: User authenticated successfully:", user.id)

    // Get user profile
    let profile = null
    try {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("email", user.email).single()
      profile = profileData
      console.log("[v0] Fleet: Profile query successful")
    } catch (profileError) {
      console.error("[v0] Fleet: Profile query failed:", profileError)
    }

    if (!profile) {
      console.log("[v0] Fleet: No profile found, redirecting to login")
      redirect("/auth/login")
    }

    return (
      <AppLayout user={{ id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role }}>
        <FleetClient />
      </AppLayout>
    )
  } catch (serverError) {
    console.error("[v0] Fleet: Server error:", serverError)
    redirect("/auth/login")
  }
}
