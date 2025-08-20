import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get user profile and organization data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const { data: organization } = profile?.organization_id
    ? await supabase.from("organizations").select("*").eq("id", profile.organization_id).single()
    : { data: null }

  const userProfile = profile || {
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || "staff",
  }

  return (
    <AppLayout user={userProfile}>
      <SettingsClient user={user} profile={profile} organization={organization} />
    </AppLayout>
  )
}
