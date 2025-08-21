"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestConnectionPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuthentication = async () => {
    setLoading(true)

    const authResults: any = {
      clientCreation: null,
      authConfigTest: null,
      signInTest: null,
      signUpTest: null,
      networkError: null,
      httpStatus: null,
      errorDetails: null,
      recommendations: [],
    }

    try {
      console.log("[v0] Testing authentication comprehensively...")
      const supabase = createClient()
      authResults.clientCreation = "success"

      // Test 1: Check if we can access auth configuration
      try {
        console.log("[v0] Testing auth configuration access...")
        const { data: session } = await supabase.auth.getSession()
        authResults.authConfigTest = "Auth service accessible"
      } catch (configError: any) {
        authResults.authConfigTest = `Auth config error: ${configError.message}`
      }

      // Test 2: Try sign up (might give different error than sign in)
      try {
        console.log("[v0] Testing sign up endpoint...")
        const { data, error } = await supabase.auth.signUp({
          email: "test@example.com",
          password: "testpassword123",
        })

        if (error) {
          authResults.signUpTest = `Sign up error: ${error.message}`
          if (error.message.includes("Email signups are disabled")) {
            authResults.recommendations.push("Enable email authentication in Supabase Auth settings")
          }
        } else {
          authResults.signUpTest = "Sign up endpoint accessible (but didn't create user)"
        }
      } catch (signUpError: any) {
        authResults.signUpTest = `Sign up network error: ${signUpError.message}`
        authResults.networkError = signUpError
      }

      // Test 3: Try sign in (original failing test)
      try {
        console.log("[v0] Testing sign in endpoint...")
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "test@example.com",
          password: "testpassword123",
        })

        if (error) {
          authResults.signInTest = `Sign in error: ${error.message}`
        } else {
          authResults.signInTest = "Unexpected success (should fail with invalid credentials)"
        }
      } catch (signInError: any) {
        console.log("[v0] Sign in network error:", signInError)
        authResults.signInTest = `Sign in network error: ${signInError.message}`
        authResults.networkError = signInError

        // Analyze the specific error
        if (signInError.message.includes("Failed to fetch")) {
          authResults.httpStatus = "Network Error - Failed to fetch"
          authResults.recommendations.push(
            "Check if Email authentication is enabled in Supabase Dashboard > Authentication > Settings",
          )
          authResults.recommendations.push("Verify Supabase project is not paused or deleted")
          authResults.recommendations.push("Check CORS settings in Supabase Dashboard")
        }
      }

      // Add general recommendations
      if (authResults.networkError) {
        authResults.recommendations.push("Open browser Network tab and retry to see HTTP status code")
        authResults.recommendations.push("Check Supabase project status at https://status.supabase.com/")
      }
    } catch (err: any) {
      authResults.errorDetails = err
    }

    setResults({ ...results, authTest: authResults })
    setLoading(false)
  }

  const testDirectAuthURL = async () => {
    setLoading(true)

    const directResults: any = {
      urlTest: null,
      fetchTest: null,
      error: null,
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`

      console.log("[v0] Testing direct auth URL:", authUrl)

      // Test if we can reach the auth endpoint directly
      const response = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "test123",
        }),
      })

      directResults.urlTest = `Auth URL accessible: ${response.status}`
      directResults.fetchTest = await response.text()
    } catch (err: any) {
      directResults.error = err.message
    }

    setResults({ ...results, directTest: directResults })
    setLoading(false)
  }

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
      console.log("[v0] Testing Supabase client creation...")
      console.log("[v0] URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("[v0] Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      const supabase = createClient()
      testResults.clientCreation = "success"
      console.log("[v0] Supabase client created successfully")

      console.log("[v0] Testing Supabase connection with health check...")

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
          <CardTitle>Supabase Connection & Auth Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={testAuthentication} disabled={loading} variant="outline">
              Test Authentication
            </Button>
            <Button onClick={testDirectAuthURL} disabled={loading} variant="secondary">
              Test Direct Auth URL
            </Button>
          </div>

          {results && (
            <div className="space-y-4">
              {results.authTest && (
                <div>
                  <h3 className="font-semibold">Authentication Diagnostics:</h3>
                  <div className="bg-blue-50 p-3 rounded space-y-2">
                    <p>
                      <strong>Client Creation:</strong> {results.authTest.clientCreation}
                    </p>
                    <p>
                      <strong>Auth Config Test:</strong> {results.authTest.authConfigTest}
                    </p>
                    <p>
                      <strong>Sign Up Test:</strong> {results.authTest.signUpTest}
                    </p>
                    <p>
                      <strong>Sign In Test:</strong> {results.authTest.signInTest}
                    </p>

                    {results.authTest.recommendations.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-100 rounded">
                        <strong>Recommendations:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {results.authTest.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {results.directTest && (
                <div>
                  <h3 className="font-semibold">Direct Auth URL Test:</h3>
                  <div className="bg-green-50 p-3 rounded space-y-2">
                    <p>
                      <strong>URL Test:</strong> {results.directTest.urlTest}
                    </p>
                    <p>
                      <strong>Response:</strong> {results.directTest.fetchTest}
                    </p>
                    {results.directTest.error && (
                      <p className="text-red-600">
                        <strong>Error:</strong> {results.directTest.error}
                      </p>
                    )}
                  </div>
                </div>
              )}

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
                <h3 className="font-semibold text-yellow-800">Troubleshooting Guide:</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>
                    • <strong>Most Likely Issue:</strong> Email authentication is disabled in Supabase
                  </li>
                  <li>• Go to Supabase Dashboard → Authentication → Settings → Enable email provider</li>
                  <li>• Check if your Supabase project is paused or has billing issues</li>
                  <li>• Verify CORS settings allow your domain in Supabase Dashboard → Settings → API</li>
                  <li>• If 429 error: You're rate limited, wait 15+ minutes</li>
                  <li>• If 500 error: Check Supabase status page or database triggers</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
