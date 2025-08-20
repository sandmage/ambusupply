import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

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

    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 })
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select(`
        *,
        organizations (
          name
        )
      `)
      .eq("id", invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
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

    // In a real application, you would integrate with an email service here
    // For now, we'll simulate sending the email and log the details
    console.log("=== EMAIL INVITATION ===")
    console.log("To:", invitation.email)
    console.log("Subject:", emailSubject)
    console.log("Invite URL:", inviteUrl)
    console.log("========================")

    // Here you would integrate with your email service:
    // - Resend: https://resend.com/docs
    // - SendGrid: https://docs.sendgrid.com/
    // - Nodemailer: https://nodemailer.com/
    // - AWS SES: https://aws.amazon.com/ses/

    // Example with Resend (uncomment and configure):
    /*
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: invitation.email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })
    */

    // For demo purposes, we'll return success
    return NextResponse.json({
      success: true,
      message: "Invitation email sent successfully",
      inviteUrl: inviteUrl, // Include for testing purposes
    })
  } catch (error: any) {
    console.error("Error sending invitation email:", error)
    return NextResponse.json({ error: "Failed to send invitation email" }, { status: 500 })
  }
}
