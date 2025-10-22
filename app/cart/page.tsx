"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CartItem } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { SERVICE_TYPES, PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"
import { useEffect, useState, Suspense } from "react"
import { Trash2, ShoppingBag, Gift, RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { sanitizeUserInput, sanitizePrice, sanitizeQuantity } from "@/lib/sanitize"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

function CartPageContent() {
  type DbCartItem = CartItem & { _id?: string }
  const [cartItems, setCartItems] = useState<DbCartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { toast } = useToast()

  const loadCartItems = async (showMessage = false) => {
    setIsLoading(true)
    try {
      // Try DB for authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from("cart_items")
          .select("id, quantity, booking_date, is_gift, recipient_name, recipient_email, recipient_phone, listing:listings(*, vendor:vendors(*))")
          .eq("user_id", user.id)

        if (!error && data) {
          const items: DbCartItem[] = data.map((row: any) => ({
            _id: row.id,
            listing: row.listing,
            quantity: row.quantity,
            booking_date: row.booking_date,
            is_gift: row.is_gift,
            recipient_name: row.recipient_name ?? undefined,
            recipient_email: row.recipient_email ?? undefined,
            recipient_phone: row.recipient_phone ?? undefined,
          }))
          setCartItems(items)
          
          // Show message if cart was cleared after payment
          if (showMessage && items.length === 0) {
            setRefreshMessage('✅ Cart cleared after successful payment!')
            setTimeout(() => setRefreshMessage(null), 3000)
          }
          
          setIsLoading(false)
          return
        }
      }

      // Fallback to localStorage for guests
      const cart = localStorage.getItem("cart")
      if (cart) {
        setCartItems(JSON.parse(cart))
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading cart items:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCartItems()
  }, [supabase.auth])

  // Check for refresh parameter in URL
  useEffect(() => {
    const refresh = searchParams.get('refresh')
    if (refresh === 'true') {
      console.log('Refresh parameter detected, reloading cart...')
      loadCartItems(true) // Show message
      // Remove the refresh parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('refresh')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  // Refresh cart when page becomes visible (after payment redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing cart...')
        loadCartItems()
      }
    }

    const handleFocus = () => {
      console.log('Window focused, refreshing cart...')
      loadCartItems()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item._id!).filter(Boolean))
    } else {
      setSelectedItems([])
    }
  }

  const handleGiftCheckout = async () => {
    if (selectedItems.length === 0) return

    // Mark selected items as gifts
    const { error } = await supabase
      .from("cart_items")
      .update({ is_gift: true })
      .in("id", selectedItems)

    if (error) {
      console.error("Error marking items as gifts:", error)
      return
    }

    // Redirect to simplified gift checkout
    router.push("/gift/checkout-simple")
  }

  const removeItem = async (index: number) => {
    const item = cartItems[index]
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && item?._id) {
      await supabase.from("cart_items").delete().eq("id", item._id)
      const updated = cartItems.filter((_, i) => i !== index)
      setCartItems(updated)
      window.dispatchEvent(new Event("cartUpdated"))
      return
    }

    const updatedCart = cartItems.filter((_, i) => i !== index)
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const item = cartItems[index]
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && item?._id) {
      await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", item._id)
      const updated = [...cartItems]
      updated[index].quantity = newQuantity
      setCartItems(updated)
      window.dispatchEvent(new Event("cartUpdated"))
      return
    }

    const updatedCart = [...cartItems]
    updatedCart[index].quantity = newQuantity
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const calculateSubtotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item._id!))
      .reduce((sum, item) => sum + item.listing.price * item.quantity, 0)
  }

  const calculatePlatformFee = () => {
    return calculateSubtotal() * PLATFORM_FEE_PERCENTAGE
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculatePlatformFee()
  }

  const handleSelfCheckout = async () => {
    if (selectedItems.length === 0) {
      // Show error or prompt to select items
      return
    }

    try {
      // Mark selected items as regular (not gifts)
      const { error } = await supabase
        .from("cart_items")
        .update({ is_gift: false })
        .in("id", selectedItems)

      if (error) {
        console.error("Error marking items as regular:", error)
        toast({
          title: "Error",
          description: "Failed to update cart items. Please try again.",
          variant: "destructive"
        })
        return
      }

      // Store selected item IDs in localStorage for checkout page
      localStorage.setItem("selectedCartItems", JSON.stringify(selectedItems))

      // Redirect to regular checkout
      router.push("/checkout")
    } catch (error) {
      console.error("Unexpected error in handleSelfCheckout:", error)
      toast({
        title: "Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Start browsing to add services to your cart</p>
            <Button asChild size="lg">
              <Link href="/shop">Browse Services</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Shopping Cart</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadCartItems(true)}
            disabled={isLoading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Refresh Message */}
        {refreshMessage && (
          <Alert className="mb-6">
            <AlertDescription>{refreshMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Selection Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="select-all"
                      checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All ({cartItems.length} items)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {cartItems.map((item, index) => {
              const imageUrl =
                item.listing.images?.[0] ||
                `/placeholder.svg?height=100&width=150&query=${encodeURIComponent(item.listing.title)}`
              const itemTotal = item.listing.price * item.quantity

              return (
                <Card key={index}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex items-start pt-2">
                          <Checkbox
                            id={`select-${item._id}`}
                            checked={selectedItems.includes(item._id!)}
                            onCheckedChange={(checked) => handleSelectItem(item._id!, checked as boolean)}
                          />
                        </div>
                        
                        <div className="w-20 h-16 sm:w-32 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={sanitizeUserInput(item.listing.title)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{sanitizeUserInput(item.listing.title)}</h3>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {SERVICE_TYPES[item.listing.service_type]}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="flex-shrink-0 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sanitizeUserInput(item.listing.location)}</p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Quantity:</label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm">{sanitizeQuantity(item.quantity)}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">${sanitizePrice(item.listing.price).toFixed(2)} each</div>
                            <div className="font-semibold text-base sm:text-lg">${sanitizePrice(itemTotal).toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-muted-foreground">
                          Booking date: {new Date(item.booking_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4 lg:top-20">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Order Summary</h2>
                
                {selectedItems.length > 0 ? (
                  <>
                    <div className="mb-4 p-3 bg-[#E4405F]/10 rounded-lg border border-[#E4405F]/30">
                      <p className="text-sm font-medium text-[#E4405F]">
                        {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>

                    <div className="space-y-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${sanitizePrice(calculateSubtotal()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform fee (0.5%)</span>
                        <span>${sanitizePrice(calculatePlatformFee()).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-base sm:text-lg pt-3">
                        <span>Total</span>
                        <span>${sanitizePrice(calculateTotal()).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border">
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select items to see order summary
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-accent text-white hover:bg-accent/90" 
                    size="lg" 
                    onClick={handleSelfCheckout}
                    disabled={selectedItems.length === 0}
                  >
                    Self Checkout ({selectedItems.length} selected)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg" 
                    onClick={handleGiftCheckout}
                    disabled={selectedItems.length === 0}
                  >
                    <Gift className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Gift Checkout ({selectedItems.length} selected)
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Payment will be processed with cryptocurrency
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-1/4 mb-8" />
            <div className="h-64 bg-card rounded" />
          </div>
        </div>
      </div>
    }>
      <CartPageContent />
    </Suspense>
  )
}
