"use client"

import Link from "next/link"

export function LoginHeader() {
  return (
    <header className="border-b bg-card/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-foreground">AmbuSupply</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
