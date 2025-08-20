import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.ambusupply_NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.ambusupply_NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Please configure ambusupply_NEXT_PUBLIC_SUPABASE_URL and ambusupply_NEXT_PUBLIC_SUPABASE_ANON_KEY in your project settings.",
    )
  }

  return createBrowserClient(url, key)
}
