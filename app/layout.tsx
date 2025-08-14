import type React from "react"
import type { Metadata } from "next"
import { Work_Sans, Open_Sans } from "next/font/google"
import "./globals.css"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { GestureShortcuts } from "@/components/touch-interactions/gesture-shortcuts"
import { ToastProvider } from "@/components/ui/toast"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { ConditionalHeader } from "@/components/conditional-header"

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-work-sans",
  weight: ["400", "600", "700"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "AmbuSupply - Emergency Services Management",
  description: "Empowering Emergency Services with Seamless Management",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${openSans.variable} antialiased`}>
      <body className="font-sans touch-manipulation overscroll-none pb-16 lg:pb-0">
        <ToastProvider>
          <NotificationProvider>
            <ConditionalHeader />
            <GestureShortcuts>{children}</GestureShortcuts>
            <MobileBottomNav />
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
