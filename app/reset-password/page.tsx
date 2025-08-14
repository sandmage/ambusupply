"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Eye, EyeOff } from "@/components/ui/icons"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      setMessage("Invalid reset link. Please request a new password reset.")
      return
    }
    setToken(tokenParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage("Passwords don't match")
      setIsSuccess(false)
      return
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long")
      setIsSuccess(false)
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setMessage(data.message)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?message=Password reset successful. Please log in with your new password.")
        }, 3000)
      } else {
        setIsSuccess(false)
        setMessage(data.message || "An error occurred. Please try again.")
      }
    } catch (error) {
      console.error("Reset password error:", error)
      setIsSuccess(false)
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token && !message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
            <CardDescription className="text-gray-600">Enter your new password below.</CardDescription>
          </CardHeader>

          <CardContent>
            {message && (
              <Alert className={`mb-6 ${isSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <AlertDescription className={isSuccess ? "text-green-800" : "text-red-800"}>{message}</AlertDescription>
              </Alert>
            )}

            {!isSuccess && token && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      disabled={isLoading}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      disabled={isLoading}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="text-xs space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Must match confirmation password</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}

            {isSuccess && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Redirecting to login page in 3 seconds...</p>
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Go to Login Now
                </Link>
              </div>
            )}

            {!token && !isSuccess && (
              <div className="text-center">
                <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                  Request New Reset Link
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
