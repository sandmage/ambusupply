import { createServerClient as createSupabaseClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your project settings.",
    )
  }

  let cookieStore: ReadonlyRequestCookies | null = null
  try {
    cookieStore = await cookies()
  } catch (error) {
    // During build time or in environments where cookies aren't available
    console.warn("Cookies not available, using fallback client")
    return createSupabaseClient(url, key, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          /* no-op during build */
        },
      },
    })
  }

  return createSupabaseClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore!.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore!.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export const createClient = createServerClient
