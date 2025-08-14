"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { LoginHeader } from "./login-header"

export function ConditionalHeader() {
  const pathname = usePathname()

  // Show simplified header on login/auth pages
  const isAuthPage = pathname === "/login" || pathname === "/forgot-password" || pathname.startsWith("/reset-password")

  if (isAuthPage) {
    return <LoginHeader />
  }

  return <Header />
}
