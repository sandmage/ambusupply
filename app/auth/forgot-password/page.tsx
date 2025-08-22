"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"

import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration")
      }

      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/30">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-serif font-bold text-primary mb-2">Check Your Email</h1>
              <p className="text-lg text-muted-foreground font-medium">Password reset instructions sent</p>
            </div>
            <Card className="apple-card shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-base text-muted-foreground">
                    We've sent password reset instructions to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check your email and follow the link to reset your password. The link will expire in 1 hour.
                  </p>
                  <div className="pt-4">
                    <Link href="/auth/login">
                      <Button className="apple-button-secondary w-full h-12 text-base font-semibold">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Reset Password</h1>
            <p className="text-lg text-muted-foreground font-medium">Enter your email to receive reset instructions</p>
          </div>
          <Card className="apple-card shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-serif font-bold text-primary">Forgot Your Password?</CardTitle>
              <CardDescription className="text-base font-medium">
                No worries! Enter your email address and we'll send you instructions to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ambulance.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                  {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="apple-button h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Instructions"}
                  </Button>
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline inline-flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
