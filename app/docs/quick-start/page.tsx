"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, UserPlus, Wallet, ShoppingCart, CreditCard, CheckCircle2 } from "lucide-react"
import DocsLayout from "@/components/docs-layout"

export default function QuickStartPage() {
  return (
    <DocsLayout
      currentPath="/docs/quick-start"
      title="Quick Start"
      icon={Zap}
      previousPage={{ href: "/docs/key-benefits", title: "Key Benefits" }}
      nextPage={{ href: "/docs/creating-account", title: "Creating Account" }}
    >
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-lg text-muted-foreground mb-6">
              Get started with UniTick in 5 simple steps. From account creation to your first multi-vendor booking.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Step-by-Step Guide</h2>
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">1</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3">Create Your Account</h3>
                    <p className="text-muted-foreground mb-4">
                      Sign up with your email and verify your account to get started.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Go to UniTick homepage</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Click "Sign Up"</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Enter your email and password</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Verify your email address</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">2</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3">Get UTICK Tokens from Faucet</h3>
                    <p className="text-muted-foreground mb-4">
                      Claim free UTICK tokens from our testnet faucet to start making purchases.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Go to your dashboard</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Click "Claim Faucet" or "Get UTICK"</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Claim free UTICK tokens (testnet only)</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Wait for tokens to appear in your wallet</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Note:</strong> You'll also need Base Sepolia ETH for gas fees. Get it from Base Sepolia faucet separately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">3</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3">Browse Available Services</h3>
                    <p className="text-muted-foreground mb-4">
                      Explore the marketplace and discover services from verified vendors.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Visit the vendors page</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Browse by category or search</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Read vendor descriptions and reviews</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Check pricing and availability</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">4</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3">Create Your First Order</h3>
                    <p className="text-muted-foreground mb-4">
                      Add services to your cart and create a multi-vendor order.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Click "Book Now" on desired services</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Add multiple services to your cart</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Review your order details</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Proceed to payment</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">5</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3">Complete Payment & Receive Tickets</h3>
                    <p className="text-muted-foreground mb-4">
                      Pay with UTICK tokens and receive your NFT tickets.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Approve UTICK token spending</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Complete the payment transaction</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Receive NFT tickets in your wallet</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Access tickets from your dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Explore More Features</h3>
                      <p className="text-sm text-muted-foreground">Learn about gift booking and ticket management</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Manage Your Wallet</h3>
                      <p className="text-sm text-muted-foreground">Top up UTICK tokens and track your balance</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Create More Orders</h3>
                      <p className="text-sm text-muted-foreground">Book services from different vendors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-bold">Leave Feedback</h3>
                      <p className="text-sm text-muted-foreground">Rate vendors and help the community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-6 border border-blue-800/50">
                <h3 className="font-bold mb-4 text-lg text-blue-300">Support Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-blue-200 font-semibold mb-2">Documentation</div>
                    <ul className="space-y-1 text-blue-400">
                      <li>• <a href="/docs/creating-account" className="underline hover:text-blue-300">Creating Account</a></li>
                      <li>• <a href="/docs/first-order" className="underline hover:text-blue-300">Your First Order</a></li>
                      <li>• <a href="/docs/payment-process" className="underline hover:text-blue-300">Payment Process</a></li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-blue-200 font-semibold mb-2">Support</div>
                    <ul className="space-y-1 text-blue-400">
                      <li>• <a href="/docs/faq" className="underline hover:text-blue-300">FAQ</a></li>
                      <li>• <a href="/docs/troubleshooting" className="underline hover:text-blue-300">Troubleshooting</a></li>
                      <li>• <a href="/docs/contact" className="underline hover:text-blue-300">Contact Support</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocsLayout>
  )
}