import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/mobile/auth - Mobile authentication
export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createClient()

    if (action === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      // Get user profile information
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
        profile,
      })
    }

    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: "Check your email for verification link",
        user: data.user,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/mobile/auth - Verify session
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    return NextResponse.json({
      success: true,
      user: session.user,
      session,
      profile,
    })
  } catch (error) {
    console.error("Session verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
