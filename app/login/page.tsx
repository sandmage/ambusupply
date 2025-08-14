"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { simpleAuth } from "@/lib/simple-auth"

const Shield = () => (
  <svg className="h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
)

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState("admin@metroems.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = "/dashboard"

  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      console.log("=== LOGIN DEBUG START ===")
      console.log("Login attempt:", { email, password: "***" })

      const success = await login(email, password)
      console.log("Login success:", success)

      if (success) {
        console.log("Login successful, checking auth state...")

        setTimeout(() => {
          const authState = simpleAuth.getState()
          console.log("Auth state after login:", authState)
          console.log("Is authenticated:", simpleAuth.isAuthenticated())
          console.log("Redirecting to:", redirectTo)

          window.location.href = redirectTo
        }, 100)
      } else {
        console.log("Login failed")
        setError("Invalid email or password")
      }
      console.log("=== LOGIN DEBUG END ===")
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-200 shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Shield />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 font-heading mb-2">
              Welcome Back to AmbuSupply
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please enter your credentials to access your dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors duration-200 hover-lift"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="text-sm text-gray-500 mb-2">Demo Credentials</div>
              <div className="bg-slate-50 rounded-lg p-3 border border-gray-200">
                <div className="font-mono text-sm text-gray-700">
                  <div>Email: admin@metroems.com</div>
                  <div>Password: admin123</div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/forgot-password"
                className="text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
