import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] Auth callback error:", error)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
      }

      if (data.user) {
        console.log("[v0] Auth callback successful for user:", data.user.id)

        // Check if user has completed setup
        const { data: profile } = await supabase
          .schema("neon_auth")
          .from("users_sync")
          .select("*")
          .eq("id", data.user.id)
          .single()

        // If no profile exists, redirect to setup
        if (!profile) {
          return NextResponse.redirect(`${origin}/setup`)
        }

        // Redirect to the intended destination
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error("[v0] Auth callback exception:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
    }
  }

  // If no code provided, redirect to login
  return NextResponse.redirect(`${origin}/auth/login?error=no_auth_code`)
}
