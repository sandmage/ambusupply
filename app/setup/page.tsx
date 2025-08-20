import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SetupWizard } from "@/components/setup-wizard"

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { rerun?: string }
}) {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("email", user.email)
    .maybeSingle()

  const isRerun = searchParams.rerun === "true"

  if (profile?.setup_completed && !isRerun) {
    redirect("/dashboard")
  }

  const existingOrganization = profile?.organizations

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isRerun ? "Update Organization Setup" : "Welcome to AmbuSupply"}
          </h1>
          <p className="text-muted-foreground">
            {isRerun
              ? "Update your organization information and preferences"
              : "Let's set up your organization to get started"}
          </p>
        </div>
        <SetupWizard user={user} profile={profile} existingOrganization={existingOrganization} isRerun={isRerun} />
      </div>
    </div>
  )
}
