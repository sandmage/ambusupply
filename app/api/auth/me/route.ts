import { type NextRequest, NextResponse } from "next/server"
import { authUtils } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    // Get user data
    const user = await authUtils.getUserById(userId)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      )
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Get user error:", error)

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
