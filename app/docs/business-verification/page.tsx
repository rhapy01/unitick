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
      { title: "My Ticket Gift", href: "/docs/my-ticket-gift" },
      { title: "Ticket Reselling", href: "/docs/ticket-reselling" },
      { title: "Free Ticket Support", href: "/docs/free-tickets" }
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

export default function BusinessVerificationPage() {
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
                              item.href === '/docs/business-verification' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
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
              <UserCheck className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Business Verification</h1>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <Badge variant="outline" className="mb-4 text-lg px-3 py-1">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Trust & Compliance
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground mb-8">
                  Business verification ensures that all vendors on UniTick are legitimate businesses, providing customers with confidence and maintaining platform integrity. This process validates your business credentials and compliance requirements.
                </p>

                {/* Verification Process */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Verification Requirements</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="font-bold text-lg">Business Documents</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Business registration certificate</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Tax identification number</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Business license (if applicable)</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Proof of address</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Bank account verification</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-green-400" />
                            </div>
                            <h3 className="font-bold text-lg">Compliance Checks</h3>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Anti-money laundering (AML)</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Know your customer (KYC)</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Sanctions screening</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Regulatory compliance</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Service quality assessment</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg p-6 border border-primary/10">
                    <h3 className="font-bold mb-4 text-lg">Verification Benefits</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Trust</div>
                        <p className="text-muted-foreground">Builds customer confidence</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Compliance</div>
                        <p className="text-muted-foreground">Meets regulatory requirements</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">Security</div>
                        <p className="text-muted-foreground">Protects platform integrity</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-6">Verification Process</h2>
                    
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                              1
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-2">Submit Documents</h3>
                              <p className="text-muted-foreground mb-4">
                                Upload all required business documents through the verification portal.
                              </p>
                              <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Upload business registration</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Provide tax information</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Submit proof of address</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Complete application form</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                              2
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-2">Review Process</h3>
                              <p className="text-muted-foreground mb-4">
                                Our verification team reviews your documents and conducts compliance checks.
                              </p>
                              <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Document authenticity check</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">AML/KYC screening</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Regulatory compliance review</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Business legitimacy verification</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                              3
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-2">Approval & Activation</h3>
                              <p className="text-muted-foreground mb-4">
                                Once approved, your business is verified and you can start offering services.
                              </p>
                              <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Verification badge added</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Wallet whitelist enabled</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Service listing activated</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">Payment processing enabled</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-3 text-lg">Timeline</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Initial review: 24-48 hours</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Document verification: 3-5 business days</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Compliance checks: 2-3 business days</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Total process: 5-10 business days</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-3 text-lg">Support</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Email support during process</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Status updates via dashboard</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Document resubmission if needed</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Appeal process for rejections</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center py-8 border-t mt-8">
              <div className="flex-1">
                <Link href="/docs/whitelist-process">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="text-sm font-medium">Wallet Whitelist Process</div>
                    </div>
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 flex justify-end">
                <Link href="/docs/vendor-dashboard">
                  <Button variant="outline" className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="text-sm font-medium">Vendor Dashboard</div>
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
