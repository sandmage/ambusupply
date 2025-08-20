import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware: Processing request to", request.nextUrl.pathname)

  const supabaseUrl = "https://oympqgqucvyonipelhsr.supabase.co"
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXBxZ3F1Y3Z5b25pcGVsaHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjU0NjIsImV4cCI6MjA3MDgwMTQ2Mn0.VPnOfggyWgM4MaNT6G4R8ekqBNxqXc-KcaeZwcloqeU"

  console.log("[v0] Middleware: Creating Supabase client with URL:", supabaseUrl)

  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = request.cookies.getAll()
        console.log(
          "[v0] Middleware: Found cookies:",
          cookies.map((c) => c.name),
        )
        return cookies
      },
      setAll(cookiesToSet) {
        console.log(
          "[v0] Middleware: Setting cookies:",
          cookiesToSet.map((c) => c.name),
        )
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  console.log("[v0] Middleware: Getting user from Supabase...")
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware: User check result:", user ? `User found: ${user.email}` : "No user found")

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    console.log("[v0] Middleware: No user found, redirecting to login")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  console.log("[v0] Middleware: User authenticated, allowing access to", request.nextUrl.pathname)

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
