"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestConnectionPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)

    const clientEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL:
        typeof window !== "undefined"
          ? (window as any).location?.origin?.includes("localhost")
            ? process.env.NEXT_PUBLIC_SUPABASE_URL
            : "Check Vercel env vars"
          : "Server-side",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? `present (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)}...)`
            : "undefined"
          : "Server-side",
    }

    const testResults: any = {
      envVars: clientEnvVars,
      actualValues: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      },
      clientCreation: null,
      connectionTest: null,
      error: null,
    }

    try {
      // Test client creation
      console.log("[v0] Testing Supabase client creation...")
      console.log("[v0] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("[v0] Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      const supabase = createClient()
      testResults.clientCreation = "success"
      console.log("[v0] Supabase client created successfully")

      console.log("[v0] Testing Supabase connection with health check...")

      // Try a simple health check first
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.log("[v0] Auth session error:", error)
          testResults.connectionTest = `auth error: ${error.message}`
          testResults.error = error
        } else {
          console.log("[v0] Auth session check successful")
          testResults.connectionTest = "auth connection successful"
        }
      } catch (authError: any) {
        console.log("[v0] Auth test failed, trying database query...")

        // Fallback to database query
        const { data, error } = await supabase.from("profiles").select("count").limit(1)

        if (error) {
          console.log("[v0] Database query error:", error)
          testResults.connectionTest = `database error: ${error.message}`
          testResults.error = error
        } else {
          console.log("[v0] Database query successful:", data)
          testResults.connectionTest = "database connection successful"
        }
      }
    } catch (err: any) {
      console.log("[v0] Test failed with error:", err)
      testResults.error = {
        message: err.message,
        name: err.name,
        stack: err.stack,
      }
      testResults.connectionTest = `failed: ${err.message}`
    }

    setResults(testResults)
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Connection"}
          </Button>

          {results && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Environment Variables:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm">{JSON.stringify(results.envVars, null, 2)}</pre>
              </div>

              <div>
                <h3 className="font-semibold">Actual Values:</h3>
                <pre className="bg-blue-50 p-2 rounded text-sm">{JSON.stringify(results.actualValues, null, 2)}</pre>
              </div>

              <div>
                <h3 className="font-semibold">Client Creation:</h3>
                <p className={results.clientCreation === "success" ? "text-green-600" : "text-red-600"}>
                  {results.clientCreation}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Connection Test:</h3>
                <p className={results.connectionTest?.includes("successful") ? "text-green-600" : "text-red-600"}>
                  {results.connectionTest}
                </p>
              </div>

              {results.error && (
                <div>
                  <h3 className="font-semibold">Error Details:</h3>
                  <pre className="bg-red-100 p-2 rounded text-sm overflow-auto max-h-40">
                    {JSON.stringify(results.error, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 rounded">
                <h3 className="font-semibold text-yellow-800">Troubleshooting:</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• If URL is undefined: Set NEXT_PUBLIC_SUPABASE_URL in Vercel environment variables</li>
                  <li>• If key is undefined: Set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables</li>
                  <li>• If "Failed to fetch": Check Supabase project status and CORS settings</li>
                  <li>• Environment variables must start with NEXT_PUBLIC_ for client-side access</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
