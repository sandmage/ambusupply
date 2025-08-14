import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Find valid reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json({ success: false, message: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: "Reset token has expired" }, { status: 400 })
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json({ success: false, message: "Reset token has already been used" }, { status: 400 })
    }

    // Check if user is active
    if (!resetToken.user.isActive) {
      return NextResponse.json({ success: false, message: "Account is not active" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: "An error occurred. Please try again." }, { status: 500 })
  }
}
