import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { 
  Shield, 
  Zap, 
  Ticket, 
  Users, 
  ArrowRight,
  CheckCircle,
  QrCode,
  Sparkles,
  CreditCard
} from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredVendors } = await supabase
    .from("vendors")
    .select("id, company_name, physical_address, logo_url, description, is_verified")
    .eq("is_verified", true)
    .limit(6)

  // Get total vendor count
  const { data: stats } = await supabase
    .from("vendors")
    .select("id")

  // Get verified vendor count
  const { data: verifiedStats } = await supabase
    .from("vendors")
    .select("id")
    .eq("is_verified", true)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section - Modern & Clean */}
        <section className="relative overflow-hidden">
          {/* Pure black background - no gradients */}
          
          <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
            <div className="max-w-5xl mx-auto">
              {/* Badge */}
              <div className="flex justify-center mb-6">
                <Badge variant="outline" className="px-4 py-2 hover:bg-accent hover:text-white transition-all duration-300 cursor-pointer" style={{backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6'}}>
                  Multi-Service Booking
                </Badge>
              </div>
              
              {/* Main Headline - Bold & Clear */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 leading-tight tracking-tight">
                The Smartest Way to Book
                <br />
                <span className="text-accent hover:scale-105 transition-transform duration-300 inline-block cursor-pointer">Multiple Services</span>
              </h1>
              
              {/* Tagline */}
              <p className="text-xl md:text-2xl text-center text-muted-foreground mb-4 font-medium">
                One platform, one checkout, endless possibilities.
              </p>

              {/* Value Prop */}
              <p className="text-base md:text-lg text-center text-muted-foreground/90 mb-10 max-w-3xl mx-auto">
                UniTick empowers users to seamlessly combine, pay for, and manage bookings across multiple independent services, all in a single frictionless experience.
              </p>
              
              {/* CTAs - Prominent */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button size="lg" className="h-12 px-8 text-base font-medium" asChild>
                  <Link href="/shop">
                    Explore Services
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium" asChild>
                  <Link href="/auth/signup">
                    Join as Service Provider
                  </Link>
                </Button>
              </div>

              {/* 3 Key Benefits - Interactive Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-accent/20 transition-colors duration-300 group-hover:scale-110">
                      <Ticket className="w-6 h-6 text-icon-primary group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <h3 className="font-semibold text-base mb-2 group-hover:text-accent transition-colors duration-300">Aggregate & Book</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Curate your whole trip or event by adding different services to one basket.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-accent/20 transition-colors duration-300 group-hover:scale-110">
                      <Zap className="w-6 h-6 text-icon-primary group-hover:animate-pulse transition-all duration-300" />
                    </div>
                    <h3 className="font-semibold text-base mb-2 group-hover:text-accent transition-colors duration-300">Streamlined Payment</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Pay once, UniTick instantly distributes payment to all service providers.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-accent/20 transition-colors duration-300 group-hover:scale-110">
                      <QrCode className="w-6 h-6 text-icon-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="font-semibold text-base mb-2 group-hover:text-accent transition-colors duration-300">Unified Access</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Get a single, secure NFT ticket for all your bookings and services.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stats - Modern Design */}
              <div className="pt-16">
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Trusted by Thousands</h2>
                  <p className="text-muted-foreground">Join the growing community of service providers and users</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Service Providers */}
                  <Card className="border-2 hover:border-accent/30 transition-all duration-300 hover:shadow-lg gradient:gradient-card gradient:gradient-border hover:-translate-y-1 group cursor-pointer">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 gradient:gradient-flow group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-8 h-8 text-icon-primary group-hover:animate-bounce" />
                    </div>
                      <div className="text-4xl md:text-5xl font-bold mb-2 text-accent gradient:gradient-text group-hover:scale-105 transition-transform duration-300">{stats?.length || 0}</div>
                      <div className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors duration-300">Service Providers</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-green-500 font-medium group-hover:text-green-400 transition-colors duration-300">{verifiedStats?.length || 0}</span> verified
                  </div>
                    </CardContent>
                  </Card>

                  {/* Platform Fee */}
                  <Card className="border-2 hover:border-accent/30 transition-all duration-300 hover:shadow-lg gradient:gradient-card gradient:gradient-border hover:-translate-y-1 group cursor-pointer">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 gradient:gradient-flow group-hover:scale-110 transition-transform duration-300">
                        <CreditCard className="w-8 h-8 text-icon-primary group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                      <div className="text-4xl md:text-5xl font-bold mb-2 text-accent gradient:gradient-text group-hover:scale-105 transition-transform duration-300">0.5%</div>
                      <div className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors duration-300">Platform Fee</div>
                      <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">Lowest in the industry</div>
                    </CardContent>
                  </Card>

                  {/* Support */}
                  <Card className="border-2 hover:border-accent/30 transition-all duration-300 hover:shadow-lg gradient:gradient-card gradient:gradient-border hover:-translate-y-1 group cursor-pointer">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 gradient:gradient-flow group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-8 h-8 text-icon-primary group-hover:animate-pulse" />
                  </div>
                      <div className="text-4xl md:text-5xl font-bold mb-2 text-accent gradient:gradient-text group-hover:scale-105 transition-transform duration-300">24/7</div>
                      <div className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors duration-300">Support</div>
                      <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">Always here to help</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Unique Value - Highlighted Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-accent/20 shadow-xl">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      What Makes UniTick Different?
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                      Unlike every other booking platform, you can book <strong className="text-foreground">multiple different services</strong> in <strong className="text-foreground">one single transaction</strong>.
                    </p>
                  </div>

                  {/* Visual Example */}
                  <div className="grid grid-cols-5 gap-4 items-center my-8">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2 text-2xl font-bold text-accent">
                        A
                      </div>
                      <p className="text-xs text-muted-foreground">Hotel Service</p>
                    </div>
                    <div className="text-center text-2xl text-accent font-bold">+</div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2 text-2xl font-bold text-accent">
                        B
                      </div>
                      <p className="text-xs text-muted-foreground">Tour Service</p>
                    </div>
                    <div className="text-center text-2xl text-accent font-bold">+</div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2 text-2xl font-bold text-accent">
                        C
                      </div>
                      <p className="text-xs text-muted-foreground">Car Rental</p>
                    </div>
                  </div>

                  {/* Flow */}
                  <div className="bg-card rounded-lg p-6 border hover:border-accent/30 transition-all duration-300">
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base">
                      <span className="font-semibold hover:text-accent transition-colors duration-300 cursor-pointer">One checkout</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground animate-pulse" />
                      <span className="font-semibold hover:text-accent transition-colors duration-300 cursor-pointer">One payment</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground animate-pulse" />
                      <span className="font-semibold hover:text-accent transition-colors duration-300 cursor-pointer">Auto-split to providers</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground animate-pulse" />
                      <span className="font-semibold text-accent hover:scale-105 transition-transform duration-300 cursor-pointer">One NFT ticket</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works - Modern Design */}
        <section className="py-20 md:py-32 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
                <Sparkles className="w-8 h-8 text-icon-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Three simple steps to transform your booking experience
              </p>
            </div>
            
            {/* Modern Step Flow */}
            <div className="max-w-6xl mx-auto">
              {/* Desktop Flow */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between relative">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl group-hover:rotate-3">
                        <CheckCircle className="w-8 h-8 text-white group-hover:animate-bounce" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-accent/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors duration-300 group-hover:scale-105">Sign Up & Browse</h3>
                    <p className="text-muted-foreground max-w-xs leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Create your account and explore services from multiple providers worldwide
                    </p>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Arrow 1 */}
                  <div className="flex-1 flex justify-center group">
                    <div className="w-16 h-1 bg-gradient-to-r from-accent to-transparent rounded-full group-hover:w-20 transition-all duration-300"></div>
                    <ArrowRight className="w-6 h-6 text-accent mx-2 animate-pulse group-hover:animate-bounce" />
                    <div className="w-16 h-1 bg-gradient-to-l from-accent to-transparent rounded-full group-hover:w-20 transition-all duration-300"></div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl group-hover:rotate-3">
                        <Users className="w-8 h-8 text-white group-hover:animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-accent/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors duration-300 group-hover:scale-105">Add Multiple Services</h3>
                    <p className="text-muted-foreground max-w-xs leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Add hotel, tour, car, events, everything from different providers to one cart
                    </p>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Arrow 2 */}
                  <div className="flex-1 flex justify-center group">
                    <div className="w-16 h-1 bg-gradient-to-r from-accent to-transparent rounded-full group-hover:w-20 transition-all duration-300"></div>
                    <ArrowRight className="w-6 h-6 text-accent mx-2 animate-pulse group-hover:animate-bounce" />
                    <div className="w-16 h-1 bg-gradient-to-l from-accent to-transparent rounded-full group-hover:w-20 transition-all duration-300"></div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl group-hover:rotate-3">
                        <Ticket className="w-8 h-8 text-white group-hover:animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-accent/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors duration-300 group-hover:scale-105">Pay & Get NFT Ticket</h3>
                    <p className="text-muted-foreground max-w-xs leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Connect wallet, pay once, get one unified NFT ticket for everything
                    </p>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Flow */}
              <div className="md:hidden space-y-12">
                {/* Step 1 */}
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:rotate-3">
                      <CheckCircle className="w-6 h-6 text-white group-hover:animate-bounce" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-accent/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors duration-300 group-hover:scale-105">Sign Up & Browse</h3>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Create your account and explore services from multiple providers worldwide
                    </p>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Mobile Arrow */}
                <div className="flex justify-center group">
                  <div className="w-1 h-8 bg-gradient-to-b from-accent to-transparent rounded-full group-hover:h-10 transition-all duration-300"></div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:rotate-3">
                      <Users className="w-6 h-6 text-white group-hover:animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-accent/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors duration-300 group-hover:scale-105">Add Multiple Services</h3>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Add hotel, tour, car, events, everything from different providers to one cart
                    </p>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Mobile Arrow */}
                <div className="flex justify-center group">
                  <div className="w-1 h-8 bg-gradient-to-b from-accent to-transparent rounded-full group-hover:h-10 transition-all duration-300"></div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-6 group cursor-pointer">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:rotate-3">
                      <Ticket className="w-6 h-6 text-white group-hover:animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent to-accent/80 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors duration-300 group-hover:scale-105">Pay & Get NFT Ticket</h3>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      Connect wallet, pay once, get one unified NFT ticket for everything
                    </p>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="text-center mt-16">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold bg-accent text-white hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" asChild>
                  <Link href="/shop">
                    Ready to get started?
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Services */}
        {featuredVendors && featuredVendors.length > 0 && (
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted Services</h2>
                <p className="text-lg text-muted-foreground">
                  Top-rated services, verified and reviewed by our community
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
                {featuredVendors.map((vendor) => (
                  <Card key={vendor.id} className="hover:shadow-lg transition-all hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {vendor.logo_url ? (
                            <img 
                              src={vendor.logo_url} 
                              alt={vendor.company_name} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-lg font-bold text-primary">
                              {vendor.company_name?.charAt(0) || "S"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{vendor.company_name}</h3>
                            {vendor.is_verified && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {vendor.physical_address || "Verified Service"}
                          </p>
                        </div>
                      </div>
                      {vendor.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {vendor.description}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/vendor/${vendor.id}/listings`}>
                          View Services
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/vendors">
                    Browse All Services
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section - Strong Finish */}
        <section className="py-16 md:py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stop Making Multiple Bookings
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Plan your entire trip in one go. Book everything you need with a single transaction and get one ticket for all your services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-12 px-8" asChild>
                  <Link href="/shop">
                    Start Booking Now
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 px-8" 
                  asChild
                >
                  <Link href="/auth/signup">
                    <Users className="w-4 h-4 mr-2 text-icon-primary" />
                    Become a Service Provider
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
