import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <a href="/">Go home</a>
          </Button>
          <Button variant="outline" asChild className="w-full bg-transparent">
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
