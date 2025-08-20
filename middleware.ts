import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password", "/invite"]

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for authentication token in cookies
  const token = request.cookies.get("sb-access-token")

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes (to avoid conflicts)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
