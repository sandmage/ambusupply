import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Settings } from "lucide-react"

export default async function HomePage() {
  console.log("[v0] Environment variables check:")
  console.log(
    "[v0] ambusupply_NEXT_PUBLIC_SUPABASE_URL:",
    process.env.ambusupply_NEXT_PUBLIC_SUPABASE_URL ? "✓ Found" : "✗ Missing",
  )
  console.log(
    "[v0] ambusupply_NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.ambusupply_NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Found" : "✗ Missing",
  )

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] User check:", user ? "User found" : "No user")

    if (user) {
      redirect("/dashboard")
    } else {
      redirect("/auth/login")
    }
  } catch (error) {
    console.log("[v0] Supabase client error:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Configuration Required</CardTitle>
            <CardDescription>Supabase integration needs to be configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Setup Required</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Please configure your Supabase integration in Project Settings to use the ambulance supply
                    management system.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Required environment variables:</p>
              <ul className="space-y-1 text-xs font-mono bg-gray-50 p-3 rounded">
                <li>ambusupply_NEXT_PUBLIC_SUPABASE_URL</li>
                <li>ambusupply_NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
