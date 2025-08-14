import { type NextRequest, NextResponse } from "next/server"
import { authUtils, AuthError } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const { email, password } = loginSchema.parse(body)

    // Authenticate user
    const result = await authUtils.authenticateUser(email, password)

    // Create response
    const response = NextResponse.json({
      success: true,
      data: result,
      message: "Login successful",
      timestamp: new Date().toISOString(),
    })

    // Set HTTP-only cookie for additional security
    response.cookies.set("auth_token", result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: result.tokens.expiresIn,
    })

    return response
  } catch (error) {
    console.error("Login error:", error)

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
