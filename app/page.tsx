"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Shield, Truck, Package, Users, ArrowRight, CheckCircle } from "@/components/ui/icons"

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [mounted, isLoading, isAuthenticated, router])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AmbuSupply</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Empowering Emergency Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Streamline your ambulance fleet management, medical supply tracking, and emergency response operations
              with our comprehensive platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Fleet Management</h3>
            <p className="text-gray-600">
              Track ambulance locations, maintenance schedules, and deployment status in real-time.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Supply Tracking</h3>
            <p className="text-gray-600">
              Monitor medical supplies, medications, and equipment across all locations and vehicles.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Team Coordination</h3>
            <p className="text-gray-600">
              Coordinate staff schedules, training records, and communication across your organization.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose AmbuSupply?</h2>
            <p className="text-gray-600 text-lg">Built specifically for emergency medical services</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Real-time fleet tracking and management",
              "Automated supply level monitoring",
              "Compliance reporting and documentation",
              "Mobile-optimized for field operations",
              "Integration with existing EMS systems",
              "24/7 support from healthcare technology experts",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
