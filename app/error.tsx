"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
          <p className="mt-2 text-muted-foreground">An unexpected error occurred. Please try again.</p>
        </div>
        <div className="space-y-4">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button variant="outline" asChild className="w-full bg-transparent">
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
