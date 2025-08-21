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
    const testResults: any = {
      envVars: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "undefined",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "undefined",
      },
      clientCreation: null,
      connectionTest: null,
      error: null,
    }

    try {
      // Test client creation
      console.log("[v0] Testing Supabase client creation...")
      const supabase = createClient()
      testResults.clientCreation = "success"
      console.log("[v0] Supabase client created successfully")

      // Test basic connection
      console.log("[v0] Testing Supabase connection...")
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        console.log("[v0] Connection test error:", error)
        testResults.connectionTest = `error: ${error.message}`
        testResults.error = error
      } else {
        console.log("[v0] Connection test successful:", data)
        testResults.connectionTest = "success"
      }
    } catch (err: any) {
      console.log("[v0] Test failed with error:", err)
      testResults.error = err.message
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
                <h3 className="font-semibold">Client Creation:</h3>
                <p className={results.clientCreation === "success" ? "text-green-600" : "text-red-600"}>
                  {results.clientCreation}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Connection Test:</h3>
                <p className={results.connectionTest === "success" ? "text-green-600" : "text-red-600"}>
                  {results.connectionTest}
                </p>
              </div>

              {results.error && (
                <div>
                  <h3 className="font-semibold">Error Details:</h3>
                  <pre className="bg-red-100 p-2 rounded text-sm">{JSON.stringify(results.error, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
