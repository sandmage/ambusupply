"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Mail, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface InvitationDialogProps {
  organizationId: string
  onInvitationSent: () => void
}

export function InvitationDialog({ organizationId, onInvitationSent }: InvitationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")

  const supabase = createClient()

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setIsLoading(true)
    try {
      // Get current user profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

      if (!profile) throw new Error("Profile not found")

      // Create invitation
      const { data: invitation, error } = await supabase
        .from("invitations")
        .insert({
          organization_id: organizationId,
          invited_by: profile.id,
          email: email.trim().toLowerCase(),
          role: role,
        })
        .select()
        .single()

      if (error) throw error

      // Send invitation email
      try {
        const response = await fetch("/api/send-invitation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitationId: invitation.id,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to send invitation email")
        }

        toast.success("Invitation sent successfully!")

        // Show the invitation URL for testing purposes
        if (result.inviteUrl) {
          console.log("Invitation URL:", result.inviteUrl)
          toast.info("Check console for invitation link (for testing)")
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
        toast.warning("Invitation created but email failed to send. Please share the invitation link manually.")
      }

      setEmail("")
      setRole("staff")
      setIsOpen(false)
      onInvitationSent()
    } catch (error: any) {
      console.error("Error sending invitation:", error)
      if (error.code === "23505") {
        toast.error("An invitation has already been sent to this email address")
      } else {
        toast.error("Failed to send invitation. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New User
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
            <p>An invitation email will be sent to the user with instructions to join your organization.</p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSendInvitation} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
