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
import { Wallet, ArrowLeft, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { sanitizeUserInput, sanitizePrice, sanitizeQuantity } from "@/lib/sanitize"
 
export default function CheckoutPage() {
  type DbCartItem = CartItem & { _id: string }
  const [cartItems, setCartItems] = useState<DbCartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const nowUtcIso = () => new Date().toISOString()
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

      // Backfill missing booking_date at DB level, then fetch
      await supabase
        .from("cart_items")
        .update({ booking_date: nowUtcIso() })
        .eq("user_id", user.id)
        .is("booking_date", null)

      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, booking_date, listing:listings(*, vendor:vendors(*))")
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
      }))

      if (items.length === 0) {
        router.push("/cart")
        return
      }

      // Filter out gift items for regular checkout
      const regularItems = items.filter(item => !item.is_gift)
      if (regularItems.length === 0) {
        router.push("/cart")
        return
      }

      // Check if user came from cart with specific selections
      const selectedFromCart = localStorage.getItem("selectedCartItems")
      let itemsToShow: DbCartItem[]

      if (selectedFromCart) {
        // Only show selected items from cart
        const selectedIds = JSON.parse(selectedFromCart)
        itemsToShow = regularItems.filter(item => selectedIds.includes(item._id))

        // If no matching items found, redirect back to cart
        if (itemsToShow.length === 0) {
          localStorage.removeItem("selectedCartItems")
          router.push("/cart")
          return
        }
      } else {
        // Direct access to checkout - show all items
        itemsToShow = regularItems
      }

      setCartItems(itemsToShow)

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

  const handleConnectWallet = async () => {
    // Validate required fields for all items (all are selected from cart)
    for (const item of cartItems) {
      if (!item.booking_date) {
        setFormError("Please select a booking date for each item before continuing.")
        return
      }
    }

    setFormError(null)
    
    // Check if user has an internal wallet
    if (!walletConnected || !walletAddress) {
      setFormError("No wallet found. Please ensure you have an internal wallet set up.")
      return
    }

    // All items are selected - store all item IDs for payment page
    const allItemIds = cartItems.map(item => item._id)
    localStorage.setItem("selectedCartItems", JSON.stringify(allItemIds))

    // Proceed to payment with internal wallet
    try {
      router.push("/payment")
    } catch (_err) {
      window.location.href = "/payment"
    }
  }

  const updateCartItem = async (index: number, changes: Partial<CartItem>) => {
    const item = cartItems[index]
    if (!item) return
    await supabase
      .from("cart_items")
      .update({
        quantity: changes.quantity ?? item.quantity,
        booking_date: changes.booking_date ?? item.booking_date,
        is_gift: changes.is_gift ?? item.is_gift ?? false,
        recipient_name: changes.recipient_name ?? item.recipient_name ?? null,
        recipient_email: changes.recipient_email ?? item.recipient_email ?? null,
        recipient_phone: changes.recipient_phone ?? item.recipient_phone ?? null,
      })
      .eq("id", item._id)

    const updated = [...cartItems]
    updated[index] = { ...item, ...changes }
    setCartItems(updated)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const incrementQty = async (index: number) => {
    const item = cartItems[index]
    if (!item) return
    await updateCartItem(index, { quantity: item.quantity + 1 })
  }

  const decrementQty = async (index: number) => {
    const item = cartItems[index]
    if (!item) return
    const newQty = item.quantity - 1
    if (newQty <= 0) {
      await supabase.from("cart_items").delete().eq("id", item._id)
      const updated = cartItems.filter((_, i) => i !== index)
      setCartItems(updated)
      window.dispatchEvent(new Event("cartUpdated"))
      return
    }
    await updateCartItem(index, { quantity: newQty })
  }

  const groupedItems = cartItems.reduce(
    (acc, item) => {
      const type = item.listing.service_type
      if (!acc[type]) acc[type] = []
      acc[type].push(item)
      return acc
    },
    {} as Record<string, CartItem[]>,
  )

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-1/4 mb-8" />
            <div className="h-64 bg-card rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shopping
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Summary ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([serviceType, items]) => (
                    <div key={serviceType} className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Badge variant="secondary">{SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES]}</Badge>
                        <span className="text-sm text-muted-foreground">({items.length} items)</span>
                      </div>
                      {items.map((item, index) => {
                        const cartIndex = cartItems.findIndex((ci) => ci === item)
                        return (
                          <div key={index} className="pl-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-4">
                                <h3 className="font-semibold">{sanitizeUserInput(item.listing.title)}</h3>
                                <p className="text-sm text-muted-foreground">{sanitizeUserInput(item.listing.location)}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  <div className="flex flex-col gap-1">
                                    <Label>Booking Timestamp (UTC)</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {item.booking_date
                                        ? new Date(item.booking_date as string).toISOString().replace(/\..+/, "Z")
                                        : nowUtcIso().replace(/\..+/, "Z")}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label>Quantity</Label>
                                    <div className="flex items-center gap-2">
                                      <Button type="button" variant="outline" onClick={() => decrementQty(cartIndex)}>-</Button>
                                      <span className="min-w-[2ch] text-center">{sanitizeQuantity(item.quantity)}</span>
                                      <Button type="button" variant="outline" onClick={() => incrementQty(cartIndex)}>+</Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right min-w-[110px]">
                                <p className="font-semibold">${sanitizePrice(item.listing.price * item.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <Wallet className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Internal Cryptocurrency Wallet</h3>
                    {walletConnected && walletAddress ? (
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                        <p className="text-xs text-green-600">✅ Ready for payment</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">No internal wallet found</p>
                        <p className="text-xs text-red-600">⚠️ Please set up your internal wallet</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-20">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Payment Details</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${sanitizePrice(calculateSubtotal()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee (0.5%)</span>
                    <span>${sanitizePrice(calculatePlatformFee()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-3">
                    <span>Total</span>
                    <span>${sanitizePrice(calculateTotal()).toFixed(2)}</span>
                  </div>
                </div>

                {formError && <p className="text-sm text-red-500 mb-3">{sanitizeUserInput(formError)}</p>}
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleConnectWallet}
                  disabled={!walletConnected || !walletAddress}
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  {walletConnected && walletAddress ? "Continue to Payment" : "Wallet Not Available"}
                </Button>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    By proceeding, you agree to our terms of service. Payment will be processed directly to vendors via
                    cryptocurrency.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
