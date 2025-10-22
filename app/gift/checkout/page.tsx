"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CartItem } from "@/lib/types"
import { PLATFORM_FEE_PERCENTAGE, SERVICE_TYPES } from "@/lib/constants"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Wallet, ArrowLeft, Gift, AlertCircle, CheckCircle2, Settings } from "lucide-react"
import Link from "next/link"
import { sanitizeUserInput, sanitizePrice, sanitizeQuantity } from "@/lib/sanitize"

export default function GiftCheckoutPage() {
  type DbCartItem = CartItem & { _id: string }
  const [cartItems, setCartItems] = useState<DbCartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const run = async () => {
      const checkAuth = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }
        setIsAuthenticated(true)
      }

      // Load cart from database
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, booking_date, is_gift, recipient_name, recipient_email, recipient_phone, recipient_wallet, gift_message, listing:listings(*, vendor:vendors(*))")
        .eq("user_id", user.id)

      if (error) {
        router.push("/cart")
        return
      }

      const items: DbCartItem[] = (data || []).map((row: any) => ({
        _id: row.id,
        listing: row.listing,
        quantity: row.quantity,
        booking_date: row.booking_date,
        is_gift: row.is_gift,
        recipient_name: row.recipient_name ?? undefined,
        recipient_email: row.recipient_email ?? undefined,
        recipient_phone: row.recipient_phone ?? undefined,
        recipient_wallet: row.recipient_wallet ?? undefined,
        gift_message: row.gift_message ?? undefined,
      }))

      if (items.length === 0) {
        router.push("/cart")
        return
      }

      // Filter only gift items
      const giftItems = items.filter(item => item.is_gift)
      if (giftItems.length === 0) {
        router.push("/cart")
        return
      }

      setCartItems(giftItems)
      await checkAuth()
      
      // Check for internal wallet
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single()
      
      if (profile?.wallet_address) {
        setWalletConnected(true)
        setWalletAddress(profile.wallet_address)
      } else {
        setWalletConnected(false)
        setWalletAddress(null)
      }
      
      setIsLoading(false)
    }
    run()
  }, [router, supabase.auth])

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.listing.price * item.quantity, 0)
  }

  const calculatePlatformFee = () => {
    return calculateSubtotal() * PLATFORM_FEE_PERCENTAGE
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculatePlatformFee()
  }

  const handleProceedToPayment = () => {
    // Validate all gift items have complete recipient information
    for (const item of cartItems) {
      if (!item.booking_date) {
        setFormError("Please select a booking date for each item before continuing.")
        return
      }
      if (!item.recipient_name || !item.recipient_email || !item.recipient_wallet) {
        setFormError("Please complete gift configuration for all items. Click 'Edit Gift' to add missing information.")
        return
      }
    }

    setFormError(null)
    router.push("/payment")
  }

  const updateCartItem = async (index: number, changes: Partial<CartItem>) => {
    const item = cartItems[index]
    if (!item._id) return

    const { error } = await supabase
      .from("cart_items")
      .update(changes)
      .eq("id", item._id)

    if (error) {
      console.error("[v0] Error updating cart item:", error)
      return
    }

    setCartItems(prev => prev.map((cartItem, i) => 
      i === index ? { ...cartItem, ...changes } : cartItem
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/cart">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cart
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gift Checkout</h1>
              <p className="text-muted-foreground">Review your gift purchases and complete payment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Gift Items */}
              {cartItems.map((item, index) => {
                const itemTotal = item.listing.price * item.quantity
                return (
                  <Card key={index} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Gift Item</CardTitle>
                        <Badge variant="secondary" className="ml-auto">
                          {SERVICE_TYPES[item.listing.service_type]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Service Details */}
                      <div className="flex gap-4">
                        {item.listing.images?.[0] && (
                          <img
                            src={item.listing.images[0]}
                            alt={sanitizeUserInput(item.listing.title)}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{sanitizeUserInput(item.listing.title)}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {sanitizeUserInput(item.listing.vendor?.business_name)}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">{sanitizeUserInput(item.listing.location)}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Quantity: {sanitizeQuantity(item.quantity)}</span>
                            <span className="font-semibold text-primary">${sanitizePrice(itemTotal).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Recipient Information */}
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Gift Recipient
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/gift/configure/${item._id}`)}
                            className="gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Configure
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2 font-medium">{sanitizeUserInput(item.recipient_name)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="ml-2 font-medium">{sanitizeUserInput(item.recipient_email)}</span>
                          </div>
                          {item.recipient_phone && (
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <span className="ml-2 font-medium">{sanitizeUserInput(item.recipient_phone)}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Wallet:</span>
                            <span className="ml-2 font-mono text-xs">{sanitizeUserInput(item.recipient_wallet)?.slice(0, 10)}...</span>
                          </div>
                        </div>
                        {item.gift_message && (
                          <div className="mt-3 pt-3 border-t border-primary/20">
                            <span className="text-muted-foreground text-sm">Message:</span>
                            <p className="mt-1 text-sm italic">"{sanitizeUserInput(item.gift_message)}"</p>
                          </div>
                        )}
                      </div>

                      {/* Booking Date */}
                      <div>
                        <label className="text-sm font-medium">Booking Date</label>
                        <input
                          type="date"
                          value={item.booking_date ? new Date(item.booking_date).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateCartItem(index, { booking_date: e.target.value })}
                          className="mt-1 w-full px-3 py-2 border border-input rounded-md"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Error Message */}
              {formError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{sanitizeUserInput(formError)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Gift Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${sanitizePrice(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee (0.5%)</span>
                      <span>${sanitizePrice(calculatePlatformFee()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                      <span>Total</span>
                      <span>${sanitizePrice(calculateTotal()).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#E4405F]/10 rounded-lg border border-[#E4405F]/30">
                    <p className="text-sm text-[#E4405F] font-medium mb-1">🎁 Gift Purchase</p>
                    <p className="text-xs text-muted-foreground">
                      NFT tickets will be minted to recipient wallets after payment
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleProceedToPayment}
                    disabled={!walletConnected}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {walletConnected ? "Proceed to Payment" : "Connect Wallet to Pay"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Payment will be processed with cryptocurrency
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
