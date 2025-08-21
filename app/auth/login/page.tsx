"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Building2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteId = searchParams.get("invite")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // If user is logged in and has an invitation, redirect to accept invitation
          if (inviteId) {
            router.push(`/invite/${inviteId}`)
            return
          }
          router.push("/dashboard")
          return
        }

        // If there's an invitation ID, fetch invitation details
        if (inviteId) {
          const { data, error } = await supabase
            .from("invitations")
            .select(`
              *,
              organizations (
                name
              )
            `)
            .eq("id", inviteId)
            .is("accepted_at", null)
            .gt("expires_at", new Date().toISOString())
            .single()

          if (!error && data) {
            setInvitation(data)
            setEmail(data.email)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, inviteId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting login process...")
      const supabase = createClient()
      console.log("[v0] Supabase client created, attempting sign in...")

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Sign in response:", { data: !!data, error: error?.message })

      if (error) {
        throw error
      }

      // If logging in with invitation, redirect to invitation acceptance
      if (inviteId) {
        router.push(`/invite/${inviteId}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)

      let errorMessage = "An error occurred during login"

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Unable to connect to authentication service. Please check your internet connection and try again."
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-lg text-muted-foreground font-medium">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Activity className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">AmbuSupply</h1>
            <p className="text-lg text-muted-foreground font-medium">
              {invitation ? "Sign in to join organization" : "Medical Inventory Management"}
            </p>
          </div>
          <Card className="apple-card shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-serif font-bold text-primary">
                {invitation ? "Join Organization" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-base font-medium">
                {invitation
                  ? `Sign in to join ${invitation.organizations.name}`
                  : "Enter your credentials to access the system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitation && (
                <Alert className="mb-6">
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    You're being invited to join <strong>{invitation.organizations.name}</strong> as a{" "}
                    <strong>{invitation.role}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ambulance.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                      disabled={!!invitation}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password" className="text-base font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                  {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="apple-button h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="mt-6 text-center text-base">
                  <span className="text-muted-foreground">Need an account? </span>
                  {invitation ? (
                    <Link
                      href={`/auth/sign-up?invite=${inviteId}`}
                      className="text-primary font-semibold hover:underline underline-offset-4"
                    >
                      Sign up with invitation
                    </Link>
                  ) : (
                    <span className="text-primary font-semibold">Contact your administrator</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
