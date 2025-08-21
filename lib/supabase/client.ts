import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  console.log("[v0] Supabase URL:", url ? `${url.substring(0, 20)}...` : "undefined")
  console.log("[v0] Supabase Key:", key ? `${key.substring(0, 20)}...` : "undefined")

  if (!url || !key) {
    const errorMsg = `Missing Supabase environment variables. URL: ${url ? "set" : "missing"}, Key: ${key ? "set" : "missing"}`
    console.error("[v0] Supabase config error:", errorMsg)
    throw new Error(errorMsg)
  }

  try {
    new URL(url)
  } catch (e) {
    const errorMsg = `Invalid Supabase URL format: ${url}`
    console.error("[v0] Supabase URL error:", errorMsg)
    throw new Error(errorMsg)
  }

  console.log("[v0] Creating Supabase client...")
  return createBrowserClient(url, key)
}
