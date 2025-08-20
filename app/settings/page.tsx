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

  return (
    <AppLayout user={user} profile={profile}>
      <SettingsClient user={user} profile={profile} organization={organization} />
    </AppLayout>
  )
}
