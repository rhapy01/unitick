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

export default function CoreInnovationPage() {
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
                              item.href === '/docs/core-innovation' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
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
              <Layers className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Core Innovation</h1>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <Badge variant="outline" className="mb-4 text-lg px-3 py-1">
                    <Rocket className="mr-2 h-4 w-4" />
                    Revolutionary Multi-Vendor Architecture
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground mb-8">
                  UniTick's core innovation lies in its <strong className="text-foreground">multi-vendor booking architecture</strong> that enables users to purchase tickets from multiple service providers in a single transaction, creating a unified ticketing experience powered by blockchain technology.
                </p>

                {/* Core Innovations */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-6">The Three Pillars of Innovation</h2>
                    
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="h-8 w-8 text-blue-500" />
                          </div>
                          <h3 className="font-bold mb-3 text-lg">Multi-Vendor Cart</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add tickets from different vendors into a single cart, just like shopping for multiple products from different stores.
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Cross-vendor ticket selection</li>
                            <li>• Unified cart management</li>
                            <li>• Real-time price calculation</li>
                            <li>• Vendor-specific requirements</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="h-8 w-8 text-green-500" />
                          </div>
                          <h3 className="font-bold mb-3 text-lg">Single Payment Processing</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            One blockchain transaction that automatically distributes payments to multiple vendors based on their ticket prices.
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Automated payment splitting</li>
                            <li>• Platform fee calculation</li>
                            <li>• Vendor whitelist verification</li>
                            <li>• Transaction transparency</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-purple-500" />
                          </div>
                          <h3 className="font-bold mb-3 text-lg">Unified NFT Ticket</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            One NFT ticket that serves as proof for all bookings across multiple vendors, stored securely on the blockchain.
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Immutable booking proof</li>
                            <li>• Cross-vendor verification</li>
                            <li>• Digital ownership</li>
                            <li>• Transferable assets</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-bold mb-4 text-lg">Technical Innovation Breakdown</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-lg">Smart Contract Architecture</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>ERC721 NFT standard for tickets</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Multi-recipient payment distribution</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Vendor whitelist management</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Platform fee automation</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Free ticket support (0 payment)</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-lg">User Experience Innovation</h4>
                        <ul className="space-y-2 text-sm">
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
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Internal wallet integration</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Real-time booking status</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-3 text-lg">Why This Matters</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            <div>
                              <strong>Reduced Friction:</strong> One transaction instead of multiple separate bookings
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            <div>
                              <strong>Better UX:</strong> Unified ticket management across all vendors
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            <div>
                              <strong>Cost Efficiency:</strong> Single blockchain transaction fees
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            <div>
                              <strong>Transparency:</strong> All transactions recorded on blockchain
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-3 text-lg">Competitive Advantage</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <strong>First Mover:</strong> No existing platform offers true multi-vendor ticketing
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <strong>Blockchain Native:</strong> Built for Web3 from the ground up
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <strong>Vendor Network:</strong> Creates ecosystem effects as more vendors join
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <strong>Scalable Architecture:</strong> Designed to handle growing vendor ecosystem
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center py-8 border-t mt-8">
              <div className="flex-1">
                <Link href="/docs/what-is-unitick">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="text-sm font-medium">What is UniTick?</div>
                    </div>
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 flex justify-end">
                <Link href="/docs/key-benefits">
                  <Button variant="outline" className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="text-sm font-medium">Key Benefits</div>
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
