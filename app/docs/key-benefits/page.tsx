"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Zap, 
  Shield, 
  Users, 
  CreditCard, 
  Gift, 
  RefreshCw, 
  Globe, 
  Smartphone,
  BarChart3,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Home,
  FileText,
  Settings,
  HelpCircle,
  Code,
  Layers,
  Target,
  ShoppingCart,
  Wallet,
  QrCode,
  FileDown,
  Bell,
  UserCheck,
  Building2,
  ChevronLeft,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const sidebarItems = [
  {
    title: "Introduction",
    icon: Home,
    items: [
      { title: "What is UniTick?", href: "/docs/what-is-unitick" },
      { title: "Core Innovation", href: "/docs/core-innovation" },
      { title: "Key Benefits", href: "/docs/key-benefits" }
    ]
  },
  {
    title: "Getting Started",
    icon: Zap,
    items: [
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Creating Account", href: "/docs/creating-account" },
      { title: "Your First Multi-Vendor Order", href: "/docs/first-order" }
    ]
  },
  {
    title: "Core Features",
    icon: Layers,
    items: [
      { title: "Multi-Vendor Booking", href: "/docs/multi-vendor" },
      { title: "Single Payment System", href: "/docs/single-payment" },
      { title: "Unified NFT Tickets", href: "/docs/unified-tickets" },
      { title: "Internal Wallet System", href: "/docs/internal-wallet" },
      { title: "Gift Tickets", href: "/docs/gift-tickets" },
      { title: "Free Ticket Support", href: "/docs/free-tickets" }
    ]
  },
  {
    title: "Vendor System",
    icon: Building2,
    items: [
      { title: "Vendor Requirements", href: "/docs/vendor-requirements" },
      { title: "Wallet Whitelist Process", href: "/docs/whitelist-process" },
      { title: "Business Verification", href: "/docs/business-verification" },
      { title: "Vendor Dashboard", href: "/docs/vendor-dashboard" }
    ]
  },
  {
    title: "Technical",
    icon: Code,
    items: [
      { title: "Architecture Overview", href: "/docs/architecture" },
      { title: "Smart Contracts", href: "/docs/smart-contracts" },
      { title: "Security Features", href: "/docs/security" },
      { title: "API Reference", href: "/docs/api-reference" }
    ]
  },
  {
    title: "User Guides",
    icon: FileText,
    items: [
      { title: "For Customers", href: "/docs/for-customers" },
      { title: "For Vendors", href: "/docs/for-vendors" },
      { title: "Payment Process", href: "/docs/payment-process" },
      { title: "Ticket Management", href: "/docs/ticket-management" }
    ]
  },
  {
    title: "Advanced Features",
    icon: Target,
    items: [
      { title: "Order Bundling", href: "/docs/order-bundling" },
      { title: "PDF Tickets", href: "/docs/pdf-tickets" },
      { title: "QR Code Verification", href: "/docs/qr-verification" },
      { title: "Real-time Notifications", href: "/docs/notifications" }
    ]
  },
  {
    title: "Roadmap",
    icon: Rocket,
    items: [
      { title: "Phase 1: Enhanced Ownership", href: "/docs/phase-1" },
      { title: "Phase 2: Advanced Features", href: "/docs/phase-2" },
      { title: "Phase 3: Ecosystem Expansion", href: "/docs/phase-3" }
    ]
  },
  {
    title: "Support",
    icon: HelpCircle,
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
      { title: "Contact", href: "/docs/contact" }
    ]
  }
]

export default function KeyBenefitsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Introduction', 'Getting Started'])

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">Documentation</span>
                <Badge variant="secondary" className="text-xs">v1.0 Beta</Badge>
              </div>
              
              <nav className="space-y-1">
                {sidebarItems.map((section) => (
                  <div key={section.title} className="mb-2">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2 w-full text-left hover:text-foreground transition-colors"
                    >
                      <section.icon className="h-4 w-4" />
                      {section.title}
                      {expandedSections.includes(section.title) ? (
                        <ChevronDown className="h-3 w-3 ml-auto" />
                      ) : (
                        <ChevronRight className="h-3 w-3 ml-auto" />
                      )}
                    </button>
                    {expandedSections.includes(section.title) && (
                      <div className="ml-6 space-y-1 mb-4">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block text-sm py-1 px-2 rounded transition-colors ${
                              item.href === '/docs/key-benefits' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                            }`}
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Key Benefits</h1>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <Badge variant="outline" className="mb-4 text-lg px-3 py-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Why Choose UniTick?
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground mb-8">
                  UniTick delivers <strong className="text-foreground">tangible benefits</strong> for customers, vendors, and the entire ticketing ecosystem through its innovative multi-vendor architecture and blockchain technology.
                </p>

                {/* Benefits */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-6">For Customers</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="font-bold text-lg">Simplified Booking</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>One cart for multiple vendors</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Single checkout process</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Unified ticket management</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Order bundling in dashboard</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-green-500" />
                            </div>
                            <h3 className="font-bold text-lg">Cost Efficiency</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Single transaction fees</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>No multiple payment processing</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Transparent pricing</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Free ticket support</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-purple-500" />
                            </div>
                            <h3 className="font-bold text-lg">Security & Ownership</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Blockchain-verified tickets</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>True digital ownership</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Immutable booking records</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Transferable NFT tickets</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                              <Wallet className="h-5 w-5 text-orange-500" />
                            </div>
                            <h3 className="font-bold text-lg">Convenience</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Internal wallet system</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>PDF ticket generation</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>QR code verification</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Real-time notifications</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-6">For Vendors</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <h3 className="font-bold text-lg">Customer Access</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Access to multi-vendor customers</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Reduced customer acquisition costs</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Cross-vendor discovery</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Platform network effects</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-green-500" />
                            </div>
                            <h3 className="font-bold text-lg">Business Growth</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Automated payment processing</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Real-time booking analytics</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Customer behavior insights</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Scalable infrastructure</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-purple-500" />
                            </div>
                            <h3 className="font-bold text-lg">Security & Trust</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Blockchain payment verification</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Whitelist security system</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Fraud prevention</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Transparent transactions</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                              <Settings className="h-5 w-5 text-orange-500" />
                            </div>
                            <h3 className="font-bold text-lg">Easy Integration</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Simple vendor onboarding</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Comprehensive dashboard</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>API integration support</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>24/7 platform availability</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg p-6 border border-primary/10">
                    <h3 className="font-bold mb-4 text-lg">Platform-Wide Benefits</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Ecosystem</div>
                        <p className="text-muted-foreground">Creates a thriving marketplace where all participants benefit from network effects</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Innovation</div>
                        <p className="text-muted-foreground">Pioneers the future of ticketing with blockchain technology and multi-vendor architecture</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Scalability</div>
                        <p className="text-muted-foreground">Designed to grow with the ecosystem, supporting unlimited vendors and customers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center py-8 border-t mt-8">
              <div className="flex-1">
                <Link href="/docs/core-innovation">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="text-sm font-medium">Core Innovation</div>
                    </div>
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 flex justify-end">
                <Link href="/docs/quick-start">
                  <Button variant="outline" className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="text-sm font-medium">Quick Start</div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
