import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      url: supabaseUrl ? "present" : "missing",
      key: supabaseAnonKey ? "present" : "missing",
    })
    throw new Error("Missing required Supabase environment variables")
  }

  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    console.error("[v0] Invalid Supabase URL format:", supabaseUrl)
    console.error("[v0] Expected format: https://[project-id].supabase.co")
    throw new Error("Invalid Supabase URL format. Must be https://[project-id].supabase.co")
  }

  if (supabaseAnonKey.length < 100) {
    console.error("[v0] Invalid Supabase API key format - too short")
    throw new Error("Invalid Supabase API key format")
  }

  console.log("[v0] Supabase configuration validated successfully")
  console.log("[v0] URL:", supabaseUrl)
  console.log("[v0] Key length:", supabaseAnonKey.length)

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: "implicit",
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-minimal",
      },
    },
  })
}

export function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing required Supabase environment variables")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: "implicit",
    },
  })
}
