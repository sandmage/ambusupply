import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SetupWizard } from "@/components/setup-wizard"

export default async function SetupPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user has a profile and if setup is already completed
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("email", user.email)
    .maybeSingle()

  if (profile?.setup_completed) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to AmbuSupply</h1>
          <p className="text-muted-foreground">Let's set up your organization to get started</p>
        </div>
        <SetupWizard user={user} profile={profile} />
      </div>
    </div>
  )
}
