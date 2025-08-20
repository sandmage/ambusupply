import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = "https://oympqgqucvyonipelhsr.supabase.co"
  const key =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXBxZ3F1Y3Z5b25pcGVsaHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjU0NjIsImV4cCI6MjA3MDgwMTQ2Mn0.VPnOfggyWgM4MaNT6G4R8ekqBNxqXc-KcaeZwcloqeU"

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your project settings.",
    )
  }

  return createBrowserClient(url, key)
}
