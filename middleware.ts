import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function validateSupabaseConfig(url: string, key: string) {
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables in middleware")
  }

  // Check if URL is properly formatted
  if (!url.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
    throw new Error(`Invalid Supabase URL format in middleware: ${url}`)
  }

  // Check if key is properly formatted
  if (key.length < 100) {
    throw new Error("Invalid Supabase API key format in middleware")
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  validateSupabaseConfig(supabaseUrl, supabaseKey)

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // IMPORTANT: You *must* call getUser() to refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Optional: Add route protection logic here if needed
  if (
    (!user && request.nextUrl.pathname.startsWith("/dashboard")) ||
    request.nextUrl.pathname.startsWith("/inventory") ||
    request.nextUrl.pathname.startsWith("/fleet") ||
    request.nextUrl.pathname.startsWith("/users") ||
    request.nextUrl.pathname.startsWith("/settings")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
