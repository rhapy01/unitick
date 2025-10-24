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

export default function TroubleshootingPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Introduction', 'Getting Started'])
  const [expandedIssues, setExpandedIssues] = useState<string[]>([])

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    )
  }

  const toggleIssue = (issueId: string) => {
    setExpandedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(s => s !== issueId)
        : [...prev, issueId]
    )
  }

  const commonIssues = [
    {
      id: "payment-failed",
      title: "Payment Transaction Failed",
      category: "Payment Issues",
      icon: CreditCard,
      solutions: [
        "Check your UTICK token balance - ensure you have enough tokens",
        "Verify your token allowance - you may need to approve spending again",
        "Ensure you have Base Sepolia ETH for gas fees",
        "Try refreshing the page and attempting payment again",
        "Check if the vendor wallet is whitelisted",
        "Contact support if the issue persists"
      ]
    },
    {
      id: "approval-failed",
      title: "Token Approval Failed",
      category: "Payment Issues", 
      icon: Settings,
      solutions: [
        "Ensure you have Base Sepolia ETH for gas fees",
        "Check your wallet connection is active",
        "Try disconnecting and reconnecting your wallet",
        "Clear browser cache and try again",
        "Use a different browser or incognito mode",
        "Contact support with transaction hash if available"
      ]
    },
    {
      id: "ticket-not-found",
      title: "Ticket Not Found in Dashboard",
      category: "Ticket Issues",
      icon: Shield,
      solutions: [
        "Refresh the page and check again",
        "Verify the transaction was successful on Base Sepolia explorer",
        "Check if you're logged into the correct account",
        "Clear browser cache and cookies",
        "Wait a few minutes for blockchain confirmation",
        "Contact support with your order ID"
      ]
    },
    {
      id: "qr-code-not-working",
      title: "QR Code Not Scanning",
      category: "Verification Issues",
      icon: QrCode,
      solutions: [
        "Ensure the QR code is clearly visible and not damaged",
        "Try downloading a fresh PDF ticket",
        "Check if the event date has passed",
        "Verify you're using the correct QR code for the vendor",
        "Contact the vendor directly for assistance",
        "Use the backup verification method if available"
      ]
    },
    {
      id: "wallet-connection",
      title: "Wallet Connection Issues",
      category: "Wallet Issues",
      icon: Wallet,
      solutions: [
        "Refresh the page and try reconnecting",
        "Check if MetaMask or your wallet is unlocked",
        "Ensure you're on the Base Sepolia network",
        "Try disconnecting and reconnecting your wallet",
        "Clear browser cache and cookies",
        "Use a different browser if issues persist"
      ]
    },
    {
      id: "faucet-not-working",
      title: "Faucet Not Dispensing Tokens",
      category: "Token Issues",
      icon: Gift,
      solutions: [
        "Wait a few minutes for transaction confirmation",
        "Check if you've already claimed tokens recently (cooldown period)",
        "Verify you're on Base Sepolia testnet",
        "Try refreshing the page and claiming again",
        "Check your wallet address is correct",
        "Contact support if tokens don't appear after 10 minutes"
      ]
    }
  ]

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
                              item.href === '/docs/troubleshooting' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
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
              <HelpCircle className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Troubleshooting</h1>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <Badge variant="outline" className="mb-4 text-lg px-3 py-1">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Common Issues & Solutions
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground mb-8">
                  This troubleshooting guide covers the most common issues users encounter with UniTick and provides step-by-step solutions to resolve them quickly.
                </p>

                {/* Common Issues */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Common Issues</h2>
                    
                    <div className="space-y-4">
                      {commonIssues.map((issue) => (
                        <Card key={issue.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                  <issue.icon className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">{issue.title}</h3>
                                  <p className="text-sm text-muted-foreground">{issue.category}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleIssue(issue.id)}
                              >
                                {expandedIssues.includes(issue.id) ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    Hide Solutions
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Show Solutions
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {expandedIssues.includes(issue.id) && (
                              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-bold mb-3 text-sm">Solutions:</h4>
                                <ul className="space-y-2">
                                  {issue.solutions.map((solution, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                      <span>{solution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-6 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <Settings className="h-6 w-6 text-blue-400" />
                      <h3 className="font-bold text-lg text-blue-300">Quick Fixes</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-bold mb-2 text-blue-200">Browser Issues</h4>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-100">Clear browser cache</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-100">Disable browser extensions</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-100">Try incognito mode</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2 text-blue-200">Network Issues</h4>
                        <ul className="space-y-1">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-100">Check internet connection</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-100">Verify Base Sepolia network</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-100">Wait for blockchain confirmation</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-6">Prevention Tips</h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold mb-3 text-lg">Before Making Payments</h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Ensure sufficient UTICK balance</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Have Base Sepolia ETH for gas</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Check vendor whitelist status</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Verify wallet connection</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold mb-3 text-lg">Best Practices</h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Keep browser updated</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Use stable internet connection</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Don't refresh during transactions</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Save transaction hashes</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-6 border border-red-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <HelpCircle className="h-6 w-6 text-red-400" />
                      <h3 className="font-bold text-lg text-red-300">Still Need Help?</h3>
                    </div>
                    <p className="text-red-200 mb-4">
                      If you're still experiencing issues after trying these solutions, please contact our support team with the following information:
                    </p>
                    <ul className="space-y-2 text-sm text-red-200">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>Description of the issue</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>Steps you've already tried</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>Transaction hash (if applicable)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>Browser and device information</span>
                      </li>
                    </ul>
                    <div className="mt-4">
                      <Link href="/docs/contact">
                        <Button variant="outline" className="border-red-400 text-red-300 hover:bg-red-900/20">
                          Contact Support
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center py-8 border-t mt-8">
              <div className="flex-1">
                <Link href="/docs/faq">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="text-sm font-medium">FAQ</div>
                    </div>
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 flex justify-end">
                <Link href="/docs/contact">
                  <Button variant="outline" className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="text-sm font-medium">Contact</div>
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
