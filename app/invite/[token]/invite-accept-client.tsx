"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Shield, Users, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  organizations: {
    id: string
    name: string
    created_at: string
  }
}

interface InviteAcceptClientProps {
  invitation: Invitation
  user: any
}

export function InviteAcceptClient({ invitation, user }: InviteAcceptClientProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Redirect to signup with invitation token
      router.push(`/auth/sign-up?invite=${invitation.id}`)
      return
    }

    setIsAccepting(true)
    try {
      // Call the accept_invitation function
      const { data, error } = await supabase.rpc("accept_invitation", {
        p_invitation_token: invitation.id,
        p_user_id: user.id,
      })

      if (error) throw error

      if (data) {
        setIsAccepted(true)
        toast.success("Welcome to the organization!")

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error("Failed to accept invitation")
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      toast.error("Failed to accept invitation. Please try again.")
    } finally {
      setIsAccepting(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-accent/20 text-accent-foreground"
      case "staff":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Welcome!</h2>
              <p className="text-muted-foreground">
                You have successfully joined {invitation.organizations.name}. Redirecting to your dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>You've been invited to join an organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{invitation.organizations.name}</p>
                <p className="text-sm text-muted-foreground">Organization</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{invitation.email}</p>
                <p className="text-sm text-muted-foreground">Invited email</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                <Badge className={getRoleBadgeColor(invitation.role)}>
                  {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                </Badge>
                <p className="text-sm text-muted-foreground">Role</p>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleAcceptInvitation} className="w-full" disabled={isAccepting}>
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {user ? "Accepting..." : "Redirecting..."}
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  {user ? "Accept Invitation" : "Sign Up & Accept"}
                </>
              )}
            </Button>

            {!user && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a
                    href={`/auth/login?invite=${invitation.id}`}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Sign in instead
                  </a>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
