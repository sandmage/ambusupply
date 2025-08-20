import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { FleetClient } from "./fleet-client"

export default async function FleetPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("email", user.email).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <AppLayout user={{ id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role }}>
      <FleetClient />
    </AppLayout>
  )
}
