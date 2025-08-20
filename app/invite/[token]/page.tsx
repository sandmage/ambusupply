import { createServerClient } from "@/lib/supabase/server"
import { InviteAcceptClient } from "./invite-accept-client"

interface InvitePageProps {
  params: {
    token: string
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const supabase = createServerClient()
  const { token } = params

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get invitation details
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(`
      *,
      organizations (
        id,
        name,
        created_at
      )
    `)
    .eq("invitation_token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Invalid Invitation</h2>
            <p className="mt-2 text-muted-foreground">
              This invitation link is invalid, expired, or has already been used.
            </p>
            <div className="mt-6">
              <a href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated, check if they can accept this invitation
  if (user) {
    // Check if user already has a profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profile && profile.organization_id) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Already in Organization</h2>
              <p className="mt-2 text-muted-foreground">
                You are already a member of an organization. Please contact your administrator if you need to switch
                organizations.
              </p>
              <div className="mt-6">
                <a href="/dashboard" className="text-primary hover:text-primary/80 font-medium">
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  return <InviteAcceptClient invitation={invitation} user={user} />
}
