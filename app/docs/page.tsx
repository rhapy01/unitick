"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ThemeLogo } from "@/components/theme-logo"
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
  ChevronUp,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Flat list of all pages for navigation
const allPages = [
  { id: "what-is-unitick", title: "What is UniTick?", section: "Introduction" },
  { id: "core-innovation", title: "Core Innovation", section: "Introduction" },
  { id: "key-benefits", title: "Key Benefits", section: "Introduction" },
  { id: "quick-start", title: "Quick Start", section: "Getting Started" },
  { id: "creating-account", title: "Creating Account", section: "Getting Started" },
  { id: "first-order", title: "Your First Multi-Vendor Order", section: "Getting Started" },
  { id: "multi-vendor", title: "Multi-Vendor Booking", section: "Core Features" },
  { id: "single-payment", title: "Single Payment System", section: "Core Features" },
  { id: "unified-tickets", title: "Unified NFT Tickets", section: "Core Features" },
  { id: "internal-wallet", title: "Internal Wallet System", section: "Core Features" },
  { id: "gift-booking", title: "Gift Booking", section: "Core Features" },
  { id: "my-ticket-gift", title: "My Ticket Gift", section: "Core Features" },
  { id: "ticket-reselling", title: "Ticket Reselling", section: "Core Features" },
  { id: "free-tickets", title: "Free Ticket Support", section: "Core Features" },
  { id: "feedback-system", title: "Feedback System", section: "Core Features" },
  { id: "vendor-requirements", title: "Vendor Requirements", section: "Vendor System" },
  { id: "whitelist-process", title: "Wallet Whitelist Process", section: "Vendor System" },
  { id: "business-verification", title: "Business Verification", section: "Vendor System" },
  { id: "vendor-dashboard", title: "Vendor Dashboard", section: "Vendor System" },
  { id: "architecture", title: "Architecture Overview", section: "Technical" },
  { id: "smart-contracts", title: "Smart Contracts", section: "Technical" },
  { id: "security", title: "Security Features", section: "Technical" },
  { id: "api-reference", title: "API Reference", section: "Technical" },
  { id: "for-customers", title: "For Customers", section: "User Guides" },
  { id: "for-vendors", title: "For Vendors", section: "User Guides" },
  { id: "payment-process", title: "Payment Process", section: "User Guides" },
  { id: "ticket-management", title: "Ticket Management", section: "User Guides" },
  { id: "order-bundling", title: "Order Bundling", section: "Advanced Features" },
  { id: "pdf-tickets", title: "PDF Tickets", section: "Advanced Features" },
  { id: "qr-verification", title: "QR Code Verification", section: "Advanced Features" },
  { id: "notifications", title: "Real-time Notifications", section: "Advanced Features" },
  { id: "phase-1", title: "Phase 1: Enhanced Ownership", section: "Roadmap" },
  { id: "phase-2", title: "Phase 2: Advanced Features", section: "Roadmap" },
  { id: "phase-3", title: "Phase 3: Ecosystem Expansion", section: "Roadmap" },
  { id: "faq", title: "FAQ", section: "Support" },
  { id: "troubleshooting", title: "Troubleshooting", section: "Support" },
  { id: "contact", title: "Contact", section: "Support" }
]

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
      { title: "Gift Booking", href: "/docs/gift-booking" },
      { title: "My Ticket Gift", href: "/docs/my-ticket-gift" },
      { title: "Ticket Reselling", href: "/docs/ticket-reselling" },
      { title: "Free Ticket Support", href: "/docs/free-tickets" },
      { title: "Feedback System", href: "/docs/feedback-system" }
    ]
  },
  {
    title: "Vendor System",
    icon: Building2,
    items: [
      { title: "Vendor System Overview", href: "/docs/vendor-system" },
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

export default function DocsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Introduction', 'Getting Started'])
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <ThemeLogo 
            width={20} 
            height={20}
            className="h-5 w-5"
            alt="UniTick Logo"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border-2 hover:bg-accent transition-colors"
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-screen lg:h-auto">
          {/* Sidebar - GitBook style: overlay on mobile, sidebar on desktop */}
          <div className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64 bg-background lg:bg-muted/50 border-r-2 border-border flex-shrink-0 transform transition-transform duration-200 ease-in-out lg:transform-none shadow-lg lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="h-full overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-6">
                <ThemeLogo 
                  width={20} 
                  height={20}
                  className="h-5 w-5"
                  alt="UniTick Logo"
                />
                <Badge variant="secondary" className="text-xs">v1.0 Beta</Badge>
              </div>
              
              <nav className="space-y-1">
                {sidebarItems.map((section) => (
                  <div key={section.title} className="mb-2">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2 w-full text-left hover:text-primary hover:bg-accent/50 transition-colors p-2 rounded-md"
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
                            className="block text-sm py-2 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
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

          {/* Mobile overlay - Only visible when sidebar is open on mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Welcome Message */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text">UniTick Documentation</h1>
              </div>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 px-4">
                Complete guide to the decentralized ticketing platform powered by NFTs and blockchain technology
              </p>
              <Badge variant="secondary" className="mb-8">
                <Rocket className="mr-2 h-4 w-4" />
                Version 1.0 Beta
              </Badge>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/docs/what-is-unitick'}>
                  <CardContent className="p-6 text-center">
                    <Home className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Get Started</h3>
                    <p className="text-sm text-muted-foreground">Learn what UniTick is and how it works</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/docs/quick-start'}>
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Quick Start</h3>
                    <p className="text-sm text-muted-foreground">Set up your account and make your first booking</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/docs/multi-vendor'}>
                  <CardContent className="p-6 text-center">
                    <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">Core Features</h3>
                    <p className="text-sm text-muted-foreground">Explore multi-vendor booking and NFT tickets</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Popular Topics */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Popular Topics</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Link href="/docs/what-is-unitick" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <Home className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">What is UniTick?</div>
                        <div className="text-sm text-muted-foreground">Introduction to the platform</div>
                      </div>
                    </Link>
                    <Link href="/docs/multi-vendor" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Multi-Vendor Booking</div>
                        <div className="text-sm text-muted-foreground">How to book from multiple vendors</div>
                      </div>
                    </Link>
                    <Link href="/docs/vendor-requirements" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Vendor Requirements</div>
                        <div className="text-sm text-muted-foreground">Setting up as a vendor</div>
                      </div>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <Link href="/docs/payment-process" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Payment Process</div>
                        <div className="text-sm text-muted-foreground">How payments work</div>
                      </div>
                    </Link>
                    <Link href="/docs/architecture" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <Code className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Technical Architecture</div>
                        <div className="text-sm text-muted-foreground">Platform technology stack</div>
                      </div>
                    </Link>
                    <Link href="/docs/faq" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">FAQ</div>
                        <div className="text-sm text-muted-foreground">Frequently asked questions</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center py-8 border-t">
              <p className="text-muted-foreground mb-4">
                Built with ❤️ using Next.js, Supabase, and Base blockchain
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://github.com/rhapy01/unitick" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    GitHub
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}