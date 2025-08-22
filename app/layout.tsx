import type React from "react"
import type { Metadata } from "next"
import { Sankofa_Display as SF_Pro_Display, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const sfProDisplay = SF_Pro_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sf-pro",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "AmbuSupply - Medical Inventory Management",
  description: "Professional ambulance supply inventory management system for healthcare providers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sfProDisplay.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
