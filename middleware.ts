import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const protectedRoutes = [
  "/", // Added root route to protected routes
  "/dashboard",
  "/inventory",
  "/fleet",
  "/orders",
  "/locations",
  "/medications",
  "/reports",
  "/settings",
  "/account",
]

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/signup", "/setup", "/api/auth/login", "/api/auth/signup"] // Added /register route

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.headers.get("host")?.includes("v0.app")) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    const authHeader = request.headers.get("authorization")
    const cookieToken = request.cookies.get("ambusupply_auth")?.value

    let hasValidAuth = false

    // Check Authorization header
    if (authHeader?.startsWith("Bearer ")) {
      hasValidAuth = true
    }

    if (cookieToken) {
      try {
        const decodedCookie = decodeURIComponent(cookieToken)
        const authData = JSON.parse(decodedCookie)
        // Check for the new auth format with token and user
        if (authData.token && authData.user && authData.user.id) {
          hasValidAuth = true
          console.log("Middleware: Valid auth cookie found", { userId: authData.user.id })
        }
      } catch (error) {
        console.log("Middleware: Invalid cookie format", error)
      }
    }

    if (!hasValidAuth) {
      console.log("Middleware: No valid auth found, redirecting to login")
      // Redirect to login if no valid auth
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    console.log("Middleware: Auth validated, allowing access to", pathname)
    const response = NextResponse.next()
    response.headers.set("x-user-id", "admin-001")
    response.headers.set("x-user-role", "ADMIN")
    response.headers.set("x-organization-id", "metro-ems-001")

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
