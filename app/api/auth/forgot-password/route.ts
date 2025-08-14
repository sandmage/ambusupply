import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { emailService } from "@/lib/email/email-service"
import crypto from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Invalidate any existing tokens for this user
    await db.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    })

    // Create new reset token
    await db.passwordResetToken.create({
      data: {
        token: resetToken,
        expiresAt,
        userId: user.id,
      },
    })

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      `${user.firstName} ${user.lastName}`,
    )

    if (!emailSent) {
      console.error("Failed to send password reset email to:", user.email)
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid email address" }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: "An error occurred. Please try again." }, { status: 500 })
  }
}
