"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    const errorCode = searchParams.get("error_code")
    const errorDescription = searchParams.get("error_description")

    if (error === "access_denied" && errorCode === "otp_expired") {
      setIsExpired(true)
      setError("This password reset link has expired. Please request a new one.")
      return
    }

    if (error) {
      setIsExpired(true)
      setError(
        errorDescription ? decodeURIComponent(errorDescription) : "Invalid reset link. Please request a new one.",
      )
      return
    }

    const code = searchParams.get("code")
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (!code && (!accessToken || !refreshToken)) {
      setIsExpired(true)
      setError("Invalid or expired reset link. Please request a new password reset.")
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const code = searchParams.get("code")

      if (code) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
          throw new Error("Invalid or expired reset link. Please request a new one.")
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)

      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isExpired) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/30">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-destructive to-red-600 shadow-lg">
                  <Activity className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-serif font-bold text-primary mb-2">Link Expired</h1>
              <p className="text-lg text-muted-foreground font-medium">This password reset link is no longer valid</p>
            </div>
            <Card className="apple-card shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-serif font-bold text-primary">Reset Link Expired</CardTitle>
                <CardDescription className="text-base font-medium">
                  Password reset links expire for security reasons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <Link href="/auth/forgot-password">
                      <Button className="apple-button w-full h-12 text-base font-semibold">
                        Request New Reset Link
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full h-12 text-base font-semibold bg-transparent">
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
              <h1 className="text-4xl font-serif font-bold text-primary mb-2">Password Updated</h1>
              <p className="text-lg text-muted-foreground font-medium">Your password has been successfully reset</p>
            </div>
            <Card className="apple-card shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-base text-muted-foreground">
                    Your password has been successfully updated. You will be redirected to the login page shortly.
                  </p>
                  <div className="pt-4">
                    <Link href="/auth/login">
                      <Button className="apple-button w-full h-12 text-base font-semibold">Continue to Login</Button>
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
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Set New Password</h1>
            <p className="text-lg text-muted-foreground font-medium">Enter your new password below</p>
          </div>
          <Card className="apple-card shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-serif font-bold text-primary">Create New Password</CardTitle>
              <CardDescription className="text-base font-medium">
                Choose a strong password to secure your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="password" className="text-base font-medium">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword" className="text-base font-medium">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-2xl border-border/50 bg-card text-base"
                    />
                  </div>
                  {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="apple-button h-12 text-base font-semibold" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
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
