import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { invitationId, organizationId, email, role } = body

    let invitation: any

    if (invitationId) {
      // Resending existing invitation
      const { data: existingInvitation, error: invitationError } = await supabase
        .from("invitations")
        .select(`
          *,
          organizations (
            name
          )
        `)
        .eq("id", invitationId)
        .single()

      if (invitationError || !existingInvitation) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
      }
      invitation = existingInvitation
    } else {
      // Creating new invitation
      if (!organizationId || !email || !role) {
        return NextResponse.json({ error: "Organization ID, email, and role are required" }, { status: 400 })
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from("invitations")
        .select("id")
        .eq("email", email.toLowerCase())
        .eq("organization_id", organizationId)
        .is("accepted_at", null)
        .single()

      if (existingInvitation) {
        return NextResponse.json(
          { error: "An invitation has already been sent to this email address" },
          { status: 400 },
        )
      }

      // Create new invitation
      const invitationToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const { data: newInvitation, error: createError } = await supabase
        .from("invitations")
        .insert([
          {
            organization_id: organizationId,
            email: email.toLowerCase(),
            role: role,
            invitation_token: invitationToken,
            expires_at: expiresAt.toISOString(),
            invited_by: user.id,
          },
        ])
        .select(`
          *,
          organizations (
            name
          )
        `)
        .single()

      if (createError || !newInvitation) {
        return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
      }
      invitation = newInvitation
    }

    // Create invitation link
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/invite/${invitation.invitation_token}`

    // Email content
    const emailSubject = `You're invited to join ${invitation.organizations.name}`
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to ${invitation.organizations.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #2563eb; }
            .info-box { background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
              <p>Join ${invitation.organizations.name} as a ${invitation.role}</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You've been invited to join <strong>${invitation.organizations.name}</strong> as a <strong>${invitation.role}</strong> member.</p>
              
              <div class="info-box">
                <h3>What's Next?</h3>
                <ol>
                  <li>Click the invitation link below</li>
                  <li>Create your account or sign in if you already have one</li>
                  <li>Complete your profile setup</li>
                  <li>Start managing medical supplies with your team</li>
                </ol>
              </div>

              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>

              <p><strong>Important:</strong> This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}. Please accept it before then.</p>
              
              <p>If you have any questions, please contact your administrator.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #3b82f6; word-break: break-all;">${inviteUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>This invitation was sent by ${invitation.organizations.name} using AmbuSupply.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
You're invited to join ${invitation.organizations.name}!

You've been invited to join ${invitation.organizations.name} as a ${invitation.role} member.

To accept this invitation, visit: ${inviteUrl}

This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.

If you have any questions, please contact your administrator.

---
This invitation was sent by ${invitation.organizations.name} using AmbuSupply.
If you didn't expect this invitation, you can safely ignore this email.
    `

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "AmbuSupply <noreply@ambusupply.com>",
          to: invitation.email,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        })
        console.log(`✅ Email sent successfully to ${invitation.email}`)
      } else {
        // Fallback to console logging for development
        console.log("=== EMAIL INVITATION (Development Mode) ===")
        console.log("To:", invitation.email)
        console.log("Subject:", emailSubject)
        console.log("Invite URL:", inviteUrl)
        console.log("==========================================")
      }
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError)
      // Don't fail the entire request if email fails - invitation is still created
      return NextResponse.json({
        success: true,
        message: "Invitation created but email delivery failed. Please check email configuration.",
        inviteUrl: inviteUrl,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      inviteUrl: process.env.NODE_ENV === "development" ? inviteUrl : undefined, // Only include URL in development
    })
  } catch (error: any) {
    console.error("Error processing invitation:", error)
    return NextResponse.json({ error: "Failed to process invitation" }, { status: 500 })
  }
}
