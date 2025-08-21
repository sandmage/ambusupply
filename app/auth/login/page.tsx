"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { createAuthClient } from "@/lib/supabase/client"
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(false) // Set to false to skip auth check
  const [invitation, setInvitation] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteId = searchParams.get("invite")

  useEffect(() => {
    const fetchInvitation = async () => {
      if (inviteId) {
        try {
          const supabase = createAuthClient()
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
        } catch (error) {
          console.error("Invitation fetch error:", error)
        }
      }
    }

    fetchInvitation()
  }, [inviteId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting login process...")
      console.log("[v0] Environment check:", {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "missing",
      })

      const supabase = createAuthClient()
      console.log("[v0] Supabase auth client created successfully")

      console.log("[v0] Attempting signInWithPassword...")
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Login error:", error)
        throw error
      }

      console.log("[v0] Login successful, redirecting...")
      // If logging in with invitation, redirect to invitation acceptance
      if (inviteId) {
        router.push(`/invite/${inviteId}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      console.log("[v0] Login failed with error:", error)
      if (error instanceof Error) {
        console.log("[v0] Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
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
