import { type NextRequest, NextResponse } from "next/server"
import { authUtils, AuthError } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from request
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "No token provided",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    // Verify and decode token
    const payload = authUtils.verifyToken(token)

    // Get fresh user data
    const user = await authUtils.getUserById(payload.userId)

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or inactive",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    // Generate new tokens
    const newTokens = authUtils.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    })

    const response = NextResponse.json({
      success: true,
      data: newTokens,
      timestamp: new Date().toISOString(),
    })

    // Update cookie
    response.cookies.set("auth_token", newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: newTokens.expiresIn,
    })

    return response
  } catch (error) {
    console.error("Token refresh error:", error)

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
