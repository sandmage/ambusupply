import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const url = "https://oympqgqucvyonipelhsr.supabase.co"
  const key =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXBxZ3F1Y3Z5b25pcGVsaHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjU0NjIsImV4cCI6MjA3MDgwMTQ2Mn0.VPnOfggyWgM4MaNT6G4R8ekqBNxqXc-KcaeZwcloqeU"

  const cookieStore = await cookies()

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
