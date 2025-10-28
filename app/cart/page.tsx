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
import { Trash2, ShoppingBag, RefreshCw, Calendar } from "lucide-react"
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
          .select("id, quantity, booking_date, is_gift, recipient_name, recipient_email, recipient_phone, recipient_wallet, listing:listings(*, vendor:vendors(*))")
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
            recipient_wallet: row.recipient_wallet ?? undefined,
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
    console.log('Updating quantity:', { index, newQuantity, currentQuantity: cartItems[index]?.quantity })
    
    const item = cartItems[index]
    if (!item) {
      console.error('Item not found at index:', index)
      return
    }
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && item?._id) {
      console.log('Updating database quantity for item:', item._id)
      const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", item._id)
      if (error) {
        console.error('Database update error:', error)
        return
      }
      const updated = [...cartItems]
      updated[index].quantity = newQuantity
      setCartItems(updated)
      window.dispatchEvent(new Event("cartUpdated"))
      return
    }

    console.log('Updating localStorage quantity')
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
                `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(item.listing.title)}`
              const itemTotal = item.listing.price * item.quantity

              return (
                <Card key={index} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 border-2 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image Section */}
                      <div className="relative w-full sm:w-48 h-48 sm:h-32 bg-muted flex-shrink-0">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={sanitizeUserInput(item.listing.title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Selection Checkbox Overlay */}
                        <div className="absolute top-3 left-3">
                          <Checkbox
                            id={`select-${item._id}`}
                            checked={selectedItems.includes(item._id!)}
                            onCheckedChange={(checked) => handleSelectItem(item._id!, checked as boolean)}
                            className="bg-white/90 backdrop-blur-sm"
                          />
                        </div>
                        {/* Service Type Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur-sm">
                            {SERVICE_TYPES[item.listing.service_type]}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex flex-col h-full">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg sm:text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {sanitizeUserInput(item.listing.title)}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                {sanitizeUserInput(item.listing.vendor?.business_name || 'Unknown Vendor')}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                📍 {sanitizeUserInput(item.listing.location)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="flex-shrink-0 h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price and Quantity Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('Minus button clicked for index:', index)
                                    updateQuantity(index, item.quantity - 1)
                                  }}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{sanitizeQuantity(item.quantity)}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('Plus button clicked for index:', index)
                                    updateQuantity(index, item.quantity + 1)
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">${sanitizePrice(item.listing.price).toFixed(2)} each</div>
                              <div className="font-bold text-lg sm:text-xl text-primary">${sanitizePrice(itemTotal).toFixed(2)}</div>
                            </div>
                          </div>

                          {/* Booking Date */}
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Booking date: {new Date(item.booking_date).toLocaleDateString()}</span>
                            </div>
                          </div>
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
