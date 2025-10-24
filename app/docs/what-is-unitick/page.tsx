"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, ShoppingCart, CreditCard, Layers, Users, BarChart3, Globe, Zap } from "lucide-react"
import DocsLayout from "@/components/docs-layout"

export default function WhatIsUniTickPage() {
  return (
    <DocsLayout
      currentPath="/docs/what-is-unitick"
      title="What is UniTick?"
      icon={Home}
      nextPage={{ href: "/docs/core-innovation", title: "Core Innovation" }}
    >
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-lg text-muted-foreground mb-6">
              UniTick is a unified aggregation platform that revolutionizes how customers discover, book, and pay for services from multiple vendors in a single transaction.
            </p>
            
            <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-6 border border-blue-800/50 mb-8">
              <h3 className="font-bold mb-4 text-lg text-blue-300">The Aggregation Revolution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="text-blue-200 font-semibold mb-2">Customer Aggregation</div>
                  <p className="text-blue-300 mb-2">One platform, multiple vendors</p>
                  <ul className="space-y-1 text-blue-400">
                    <li>• Browse all services in one place</li>
                    <li>• Compare prices and options</li>
                    <li>• Single checkout experience</li>
                  </ul>
                </div>
                <div>
                  <div className="text-blue-200 font-semibold mb-2">Vendor Aggregation</div>
                  <p className="text-blue-300 mb-2">Access to broader customer base</p>
                  <ul className="space-y-1 text-blue-400">
                    <li>• Reach more customers</li>
                    <li>• Reduced marketing costs</li>
                    <li>• Streamlined operations</li>
                  </ul>
                </div>
                <div>
                  <div className="text-blue-200 font-semibold mb-2">Payment Aggregation</div>
                  <p className="text-blue-300 mb-2">Unified payment processing</p>
                  <ul className="space-y-1 text-blue-400">
                    <li>• Single payment for multiple services</li>
                    <li>• Automatic vendor distribution</li>
                    <li>• Blockchain transparency</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Traditional vs UniTick Aggregation</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left">Aspect</th>
                      <th className="border border-border p-3 text-left">Traditional Ticketing</th>
                      <th className="border border-border p-3 text-left">UniTick Aggregation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 font-medium">Booking Process</td>
                      <td className="border border-border p-3">Multiple websites, separate accounts</td>
                      <td className="border border-border p-3">Single platform, unified experience</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-medium">Payment Method</td>
                      <td className="border border-border p-3">Different payment systems</td>
                      <td className="border border-border p-3">Blockchain payment method</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-medium">Ticket Management</td>
                      <td className="border border-border p-3">Separate tickets, different formats</td>
                      <td className="border border-border p-3">Unified NFT tickets</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-medium">Vendor Discovery</td>
                      <td className="border border-border p-3">Manual search across platforms</td>
                      <td className="border border-border p-3">Aggregated marketplace</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-medium">Customer Data</td>
                      <td className="border border-border p-3">Fragmented across platforms</td>
                      <td className="border border-border p-3">Unified profile and history</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Core Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Multi-Vendor Booking</h3>
                      <p className="text-sm text-muted-foreground">Book services from multiple vendors in one order</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Single Payment System</h3>
                      <p className="text-sm text-muted-foreground">One payment for all services</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Layers className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Unified NFT Tickets</h3>
                      <p className="text-sm text-muted-foreground">All tickets as transferable NFTs</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Vendor Ecosystem</h3>
                      <p className="text-sm text-muted-foreground">Curated network of verified vendors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Analytics Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Comprehensive insights for vendors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                      <Globe className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Global Reach</h3>
                      <p className="text-sm text-muted-foreground">Access to worldwide services</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Data Aggregation Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">For Customers</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Unified booking experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Better price discovery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Simplified payment process</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Centralized ticket management</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">For Vendors</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Access to aggregated customer base</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Reduced customer acquisition costs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Streamlined payment processing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Enhanced market visibility</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Ecosystem Value</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h3 className="font-bold mb-2">Network Effects</h3>
                    <p className="text-muted-foreground">More vendors attract more customers, creating a virtuous cycle of growth</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h3 className="font-bold mb-2">Data Insights</h3>
                    <p className="text-muted-foreground">Aggregated data provides valuable insights for both customers and vendors</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h3 className="font-bold mb-2">Platform Innovation</h3>
                    <p className="text-muted-foreground">Continuous platform improvements benefit all ecosystem participants</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-6 border border-green-800/50">
              <h3 className="font-bold mb-4 text-lg text-green-300">Platform Network Effects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-green-200 font-semibold mb-2">Customer Benefits</div>
                  <ul className="space-y-1 text-green-400">
                    <li>• More vendor choices</li>
                    <li>• Better pricing through competition</li>
                    <li>• Improved service quality</li>
                    <li>• Enhanced platform features</li>
                  </ul>
                </div>
                <div>
                  <div className="text-green-200 font-semibold mb-2">Vendor Benefits</div>
                  <ul className="space-y-1 text-green-400">
                    <li>• Larger customer base</li>
                    <li>• Reduced marketing costs</li>
                    <li>• Platform-driven growth</li>
                    <li>• Access to customer insights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  )
}