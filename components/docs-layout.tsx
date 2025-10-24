"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  BookOpen, 
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Menu,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeLogo } from "@/components/theme-logo"

const sidebarItems = [
  {
    title: "Introduction",
    icon: BookOpen,
    items: [
      { title: "What is UniTick?", href: "/docs/what-is-unitick" },
      { title: "Core Innovation", href: "/docs/core-innovation" },
      { title: "Key Benefits", href: "/docs/key-benefits" }
    ]
  },
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Creating Account", href: "/docs/creating-account" },
      { title: "Your First Multi-Vendor Order", href: "/docs/first-order" }
    ]
  },
  {
    title: "Core Features",
    icon: BookOpen,
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
    icon: BookOpen,
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
    icon: BookOpen,
    items: [
      { title: "Architecture Overview", href: "/docs/architecture" },
      { title: "Smart Contracts", href: "/docs/smart-contracts" },
      { title: "Security Features", href: "/docs/security" },
      { title: "API Reference", href: "/docs/api-reference" }
    ]
  },
  {
    title: "User Guides",
    icon: BookOpen,
    items: [
      { title: "For Customers", href: "/docs/for-customers" },
      { title: "For Vendors", href: "/docs/for-vendors" },
      { title: "Payment Process", href: "/docs/payment-process" },
      { title: "Ticket Management", href: "/docs/ticket-management" }
    ]
  },
  {
    title: "Advanced Features",
    icon: BookOpen,
    items: [
      { title: "Order Bundling", href: "/docs/order-bundling" },
      { title: "PDF Tickets", href: "/docs/pdf-tickets" },
      { title: "QR Code Verification", href: "/docs/qr-verification" },
      { title: "Real-time Notifications", href: "/docs/notifications" }
    ]
  },
  {
    title: "Roadmap",
    icon: BookOpen,
    items: [
      { title: "Phase 1: Enhanced Ownership", href: "/docs/phase-1" },
      { title: "Phase 2: Advanced Features", href: "/docs/phase-2" },
      { title: "Phase 3: Ecosystem Expansion", href: "/docs/phase-3" }
    ]
  },
  {
    title: "Support",
    icon: BookOpen,
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
      { title: "Contact", href: "/docs/contact" }
    ]
  }
]

interface DocsLayoutProps {
  children: React.ReactNode
  currentPath?: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  previousPage?: { href: string; title: string }
  nextPage?: { href: string; title: string }
}

export default function DocsLayout({ 
  children, 
  currentPath, 
  title, 
  icon: Icon,
  previousPage,
  nextPage 
}: DocsLayoutProps) {
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
                          className={`block text-sm py-2 px-3 rounded-md transition-colors ${
                            item.href === currentPath 
                              ? 'bg-primary text-primary-foreground font-medium' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                          onClick={() => setSidebarOpen(false)}
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
          <div className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <Icon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            </div>

            {/* Content */}
            {children}

            {/* Navigation */}
            {(previousPage || nextPage) && (
              <div className="flex flex-col sm:flex-row justify-between items-center py-8 border-t mt-8 gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  {previousPage ? (
                    <Link href={previousPage.href}>
                      <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                        <ChevronLeft className="h-4 w-4" />
                        <div className="text-left">
                          <div className="text-xs text-muted-foreground">Previous</div>
                          <div className="text-sm font-medium">{previousPage.title}</div>
                        </div>
                      </Button>
                    </Link>
                  ) : (
                    <div></div>
                  )}
                </div>
                
                <div className="flex-1 w-full sm:w-auto flex justify-end">
                  {nextPage ? (
                    <Link href={nextPage.href}>
                      <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Next</div>
                          <div className="text-sm font-medium">{nextPage.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
