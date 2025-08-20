import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Package, MapPin, Truck, Users, Shield, Clock, BarChart3, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-bold text-foreground">AmbuSupply</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/invite">Join Organization</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
            Streamline Your <span className="text-primary">Ambulance Supply</span> Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Efficient tracking, seamless collaboration, and real-time oversight for emergency medical services. Keep
            your fleet ready and your supplies stocked with our comprehensive management platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link href="/auth/sign-up">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">
              Everything You Need to Manage Your Fleet
            </h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive tools designed specifically for emergency medical services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="apple-card p-6 text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Inventory Tracking</h3>
                <p className="text-muted-foreground">
                  Real-time monitoring of medical supplies with automated low-stock alerts and reorder links
                </p>
              </CardContent>
            </Card>

            <Card className="apple-card p-6 text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Location Management</h3>
                <p className="text-muted-foreground">
                  Organize supplies across multiple stations with hierarchical allocation tracking
                </p>
              </CardContent>
            </Card>

            <Card className="apple-card p-6 text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Fleet Oversight</h3>
                <p className="text-muted-foreground">
                  Monitor vehicle maintenance, registrations, and inspections with automated reminders
                </p>
              </CardContent>
            </Card>

            <Card className="apple-card p-6 text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-chart-2" />
                </div>
                <h3 className="text-xl font-serif font-semibold mb-3">Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Role-based access control with invitation system for seamless team management
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold text-foreground mb-6">
                Built for Emergency Medical Services
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform understands the critical nature of emergency medical services. Every feature is designed to
                ensure your team has the supplies and equipment they need when lives are on the line.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-chart-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Real-time Alerts</h4>
                    <p className="text-muted-foreground">Get notified instantly when supplies run low</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Secure & Compliant</h4>
                    <p className="text-muted-foreground">HIPAA-compliant with enterprise-grade security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">24/7 Availability</h4>
                    <p className="text-muted-foreground">Access your data anytime, anywhere</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-6 w-6 text-chart-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Analytics & Reports</h4>
                    <p className="text-muted-foreground">Make data-driven decisions with comprehensive reporting</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="apple-glass p-8 rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <span className="font-medium">Bandages</span>
                    <span className="text-chart-2 font-semibold">In Stock</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <span className="font-medium">Oxygen Tanks</span>
                    <span className="text-chart-3 font-semibold">Low Stock</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <span className="font-medium">Defibrillator Pads</span>
                    <span className="text-destructive font-semibold">Out of Stock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-serif font-bold mb-6">Ready to Transform Your Supply Management?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join emergency medical services across the country who trust AmbuSupply to keep their teams equipped and
            ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              asChild
            >
              <Link href="/invite">Join Existing Team</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-6 bg-muted border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-serif font-bold">AmbuSupply</span>
              </div>
              <p className="text-muted-foreground">
                Empowering emergency medical services with intelligent supply management.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="hover:text-foreground transition-colors">
                    Benefits
                  </a>
                </li>
                <li>
                  <a href="/auth/sign-up" className="hover:text-foreground transition-colors">
                    Get Started
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    HIPAA Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AmbuSupply. All rights reserved. Built for emergency medical services.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
