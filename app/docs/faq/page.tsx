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

export default function FAQPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Introduction', 'Getting Started'])
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([])

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    )
  }

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    )
  }

  const faqs = [
    {
      id: "what-is-unitick",
      question: "What is UniTick?",
      answer: "UniTick is a blockchain-based ticketing platform that allows you to purchase tickets from multiple vendors in a single transaction, with one unified NFT ticket serving as proof for all bookings."
    },
    {
      id: "how-multi-vendor",
      question: "How does multi-vendor booking work?",
      answer: "You can add services from different vendors to a single cart, configure each service (dates, quantities, options), and complete one payment that automatically distributes funds to all vendors based on their ticket prices."
    },
    {
      id: "what-is-utick",
      question: "What is UTICK?",
      answer: "UTICK is the native token of the UniTick platform. It's used for all payments on the platform. Currently, you can get UTICK tokens from our testnet faucet for free."
    },
    {
      id: "how-get-utick",
      question: "How do I get UTICK tokens?",
      answer: "On testnet, you can claim free UTICK tokens from our faucet. Go to your dashboard and click 'Claim Faucet' or 'Get UTICK'. You'll also need Base Sepolia ETH for gas fees."
    },
    {
      id: "what-is-nft-ticket",
      question: "What is an NFT ticket?",
      answer: "An NFT ticket is a blockchain-based digital ticket that serves as proof of purchase for all your bookings across multiple vendors. It's stored on the blockchain and can be verified by vendors."
    },
    {
      id: "how-payment-works",
      question: "How does the payment system work?",
      answer: "You make one payment in UTICK tokens, and the smart contract automatically splits the payment among vendors based on their ticket prices, plus a small platform fee."
    },
    {
      id: "vendor-whitelist",
      question: "What is vendor whitelisting?",
      answer: "All vendor wallet addresses must be whitelisted to receive payments. This ensures security and compliance. Vendors must complete a verification process and submit their wallet addresses."
    },
    {
      id: "free-tickets",
      question: "Can I create free tickets?",
      answer: "Yes! UniTick supports free tickets (0 payment). The platform fee is also waived for free tickets, and vendors can offer promotional or complimentary services."
    },
    {
      id: "gas-fees",
      question: "What about gas fees?",
      answer: "You need Base Sepolia ETH for gas fees to interact with the blockchain. Gas fees are separate from UTICK payments and are paid to the network, not to UniTick."
    },
    {
      id: "ticket-transfer",
      question: "Can I transfer my NFT tickets?",
      answer: "Yes! NFT tickets are transferable assets. You can send them to other addresses, gift them to friends, or potentially trade them in the future."
    },
    {
      id: "pdf-tickets",
      question: "Can I get PDF tickets?",
      answer: "Yes! You can download PDF versions of your tickets for offline use. These PDFs contain QR codes that vendors can scan for verification."
    },
    {
      id: "order-bundling",
      question: "How does order bundling work?",
      answer: "When you book multiple tickets in one order, they're grouped together in your dashboard. You can expand/collapse the order to see individual tickets, but they remain as one bundle."
    },
    {
      id: "vendor-requirements",
      question: "What are the requirements to become a vendor?",
      answer: "Vendors need to complete business verification, provide external wallet addresses for payments, and go through the whitelist process. External wallets are recommended over internal wallets."
    },
    {
      id: "platform-fee",
      question: "What is the platform fee?",
      answer: "UniTick charges a small platform fee (typically 0.5%) on paid transactions. This fee is automatically calculated and deducted from your payment. Free tickets have no platform fee."
    },
    {
      id: "support",
      question: "How can I get support?",
      answer: "You can contact our support team through the contact form, check our troubleshooting guide, or join our community discussions for help with any issues."
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
                              item.href === '/docs/faq' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
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
              <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <Badge variant="outline" className="mb-4 text-lg px-3 py-1">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Common Questions & Answers
                  </Badge>
                </div>
                
                <p className="text-lg text-muted-foreground mb-8">
                  Find answers to the most commonly asked questions about UniTick, multi-vendor booking, payments, and more.
                </p>

                {/* FAQ List */}
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <Card key={faq.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full text-left flex items-center justify-between"
                        >
                          <h3 className="font-bold text-lg">{faq.question}</h3>
                          {expandedFAQs.includes(faq.id) ? (
                            <ChevronUp className="h-5 w-5 text-primary" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-primary" />
                          )}
                        </button>
                        {expandedFAQs.includes(faq.id) && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-muted-foreground">{faq.answer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg border border-primary/10">
                  <h3 className="font-bold mb-4 text-lg">Still Have Questions?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you couldn't find the answer to your question, we're here to help!
                  </p>
                  <div className="flex gap-4">
                    <Button asChild>
                      <Link href="/docs/contact">
                        Contact Support
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/docs/troubleshooting">
                        Troubleshooting Guide
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center py-8 border-t mt-8">
              <div className="flex-1">
                <Link href="/docs/notifications">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Previous</div>
                      <div className="text-sm font-medium">Real-time Notifications</div>
                    </div>
                  </Button>
                </Link>
              </div>
              
              <div className="flex-1 flex justify-end">
                <Link href="/docs/troubleshooting">
                  <Button variant="outline" className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Next</div>
                      <div className="text-sm font-medium">Troubleshooting</div>
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
