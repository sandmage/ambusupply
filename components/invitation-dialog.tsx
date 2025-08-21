"use client"

import { useState } from "react"
import { useSession } from "./session-provider"
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

  const { user } = useSession()

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    if (!user) {
      toast.error("Not authenticated")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/send-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          email: email.trim().toLowerCase(),
          role: role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation")
      }

      toast.success("Invitation sent successfully!")

      // Show the invitation URL for testing purposes
      if (result.inviteUrl) {
        console.log("Invitation URL:", result.inviteUrl)
        toast.info("Check console for invitation link (for testing)")
      }

      setEmail("")
      setRole("staff")
      setIsOpen(false)
      onInvitationSent()
    } catch (error: any) {
      console.error("Error sending invitation:", error)
      if (error.message.includes("already been sent")) {
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
