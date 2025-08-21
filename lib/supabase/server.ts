import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function validateSupabaseConfig(url: string, key: string) {
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables")
  }

  // Check if URL is properly formatted
  if (!url.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
    throw new Error(`Invalid Supabase URL format: ${url}`)
  }

  // Check if key is properly formatted (should be a long base64-like string)
  if (key.length < 100) {
    throw new Error("Invalid Supabase API key format")
  }
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  validateSupabaseConfig(url, key)

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export { createClient as createServerClient }
