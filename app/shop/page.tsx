"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SERVICE_TYPES } from "@/lib/constants"
import type { ServiceType, Listing, CartItem } from "@/lib/types"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { serviceCategories } from "@/components/shop/service-category-tabs"
import { ListingsGrid } from "@/components/shop/listings-grid"
import { Search, ShoppingCart, ArrowRight, Sparkles } from "lucide-react"

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<ServiceType>("accommodation")
  const [listings, setListings] = useState<Record<ServiceType, Listing[]>>({
    accommodation: [],
    car_hire: [],
    tour: [],
    cinema: [],
    event: [],
  })
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartLoadingStates, setCartLoadingStates] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAllListings()
    loadCart()
  }, [])

  const loadAllListings = async () => {
    setIsLoading(true)
    try {
      // Load only the active tab listings first for faster initial load
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          *,
          vendor:vendors(id, business_name, wallet_address)
        `,
        )
        .eq("is_active", true)
        .eq("service_type", activeTab) // Only load current tab

      if (listingsError) throw listingsError

      // Get availability data only for current tab
      const availabilityResponse = await fetch(`/api/ticket-availability?service_type=${activeTab}`)
      const availabilityData = await availabilityResponse.json()

      if (!availabilityData.success) {
        throw new Error('Failed to fetch ticket availability')
      }

      // Merge availability data with listings
      const listingsWithAvailability = listingsData?.map((listing) => {
        const availability = availabilityData.listings.find((avail: any) => avail.id === listing.id)
        return {
          ...listing,
          remaining_tickets: availability?.remaining_tickets || 0,
          booked_tickets: availability?.booked_tickets || 0,
          is_sold_out: availability?.is_sold_out || false
        }
      })

      // Update only the current tab
      setListings(prev => ({
        ...prev,
        [activeTab]: listingsWithAvailability as Listing[]
      }))
    } catch (error) {
      console.error("Error loading listings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadListingsForTab = async (tab: ServiceType) => {
    if (listings[tab].length > 0) return // Already loaded
    
    setIsLoading(true)
    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          *,
          vendor:vendors(id, business_name, wallet_address)
        `,
        )
        .eq("is_active", true)
        .eq("service_type", tab)

      if (listingsError) throw listingsError

      const availabilityResponse = await fetch(`/api/ticket-availability?service_type=${tab}`)
      const availabilityData = await availabilityResponse.json()

      if (availabilityData.success) {
        const listingsWithAvailability = listingsData?.map((listing) => {
          const availability = availabilityData.listings.find((avail: any) => avail.id === listing.id)
          return {
            ...listing,
            remaining_tickets: availability?.remaining_tickets || 0,
            booked_tickets: availability?.booked_tickets || 0,
            is_sold_out: availability?.is_sold_out || false
          }
        })

        setListings(prev => ({
          ...prev,
          [tab]: listingsWithAvailability as Listing[]
        }))
      }
    } catch (error) {
      console.error("Error loading listings for tab:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from("cart_items")
      .select("*, listing:listings(*, vendor:vendors(*))")
      .eq("user_id", user.id)
    if (!error && data) {
      const items: CartItem[] = data.map((row: any) => ({
        listing: row.listing,
        quantity: row.quantity,
        booking_date: row.booking_date,
        is_gift: row.is_gift,
        recipient_name: row.recipient_name ?? undefined,
        recipient_email: row.recipient_email ?? undefined,
        recipient_phone: row.recipient_phone ?? undefined,
      }))
      setCartItems(items)
    }
  }

  const handleAddToCart = useCallback(async (listing: Listing) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Prevent multiple clicks
    if (cartLoadingStates[listing.id]) return

    // Set loading state
    setCartLoadingStates(prev => ({ ...prev, [listing.id]: true }))

    // Optimistic update - immediately update UI
    const existingCartItem = cartItems.find(item => item.listing.id === listing.id)
    if (existingCartItem) {
      setCartItems(prev => prev.map(item => 
        item.listing.id === listing.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems(prev => [...prev, {
        listing,
        quantity: 1,
        booking_date: null,
        is_gift: false
      }])
    }

    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .is("booking_date", null)
        .limit(1)
        .maybeSingle()
      
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id)
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          listing_id: listing.id,
          quantity: 1,
        })
      }
      
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
      // Revert optimistic update on error
      await loadCart()
    } finally {
      // Clear loading state
      setCartLoadingStates(prev => ({ ...prev, [listing.id]: false }))
    }
  }, [cartItems, cartLoadingStates, supabase, router])

  const handleRemoveFromCart = useCallback(async (listing: Listing) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Prevent multiple clicks
    if (cartLoadingStates[listing.id]) return

    // Set loading state
    setCartLoadingStates(prev => ({ ...prev, [listing.id]: true }))

    // Optimistic update - immediately update UI
    setCartItems(prev => prev.filter(item => item.listing.id !== listing.id))
    
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .is("booking_date", null)
      
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error removing from cart:", error)
      // Revert optimistic update on error
      await loadCart()
    } finally {
      // Clear loading state
      setCartLoadingStates(prev => ({ ...prev, [listing.id]: false }))
    }
  }, [cartLoadingStates, supabase])

  const handleCheckout = () => {
    router.push("/cart")
  }

  const filteredListings = listings[activeTab].filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const currentIndex = serviceCategories.findIndex((cat) => cat.type === activeTab)
  const nextCategory = serviceCategories[currentIndex + 1]
  const activeCategory = serviceCategories[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header Section - Modern */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="px-3 py-1.5" style={{backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6'}}>
              Multi-Service Booking
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Explore <span className="text-accent hover:text-accent/80 transition-colors cursor-pointer">Services</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse from multiple service providers. Add everything to your cart and checkout once.
          </p>
        </div>

        {/* Search Bar - Prominent */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${SERVICE_TYPES[activeTab]}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Tabs Navigation - Modern Styled */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as ServiceType)
          loadListingsForTab(v as ServiceType)
        }} className="space-y-8">
          <TabsList className="w-full justify-start gap-2 bg-muted/50 p-2 h-auto flex-wrap">
            {serviceCategories.map((category) => (
              <TabsTrigger 
                key={category.type} 
                value={category.type}
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent/10 hover:text-white transition-colors px-6 py-3 text-base"
              >
                {SERVICE_TYPES[category.type]}
              </TabsTrigger>
            ))}
          </TabsList>

          {serviceCategories.map((category) => (
            <TabsContent key={category.type} value={category.type} className="space-y-8">
              {/* Category Header - Card Style */}
              <Card className="border-2 border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{SERVICE_TYPES[category.type]}</h2>
                      <p className="text-muted-foreground">{category.description}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <Badge variant="secondary" className="text-sm">
                          {filteredListings.length} {filteredListings.length === 1 ? "service" : "services"} available
                        </Badge>
                        {cartItems.length > 0 && (
                          <Badge className="text-sm">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            {cartItems.length} in cart
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Listings Grid */}
              <ListingsGrid 
                listings={filteredListings} 
                isLoading={isLoading} 
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cartItems={cartItems}
                cartLoadingStates={cartLoadingStates}
              />

              {/* Navigation Footer - Clean */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredListings.length} {filteredListings.length === 1 ? "service" : "services"} in {SERVICE_TYPES[category.type]}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {nextCategory ? (
                        <Button 
                          onClick={() => setActiveTab(nextCategory.type)} 
                          variant="outline"
                          className="h-11"
                        >
                          Next: {SERVICE_TYPES[nextCategory.type]}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Empty State / Help Text */}
        {!isLoading && filteredListings.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or browse other categories
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bottom CTA - If cart has items */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <Card className="shadow-2xl border-2 border-accent/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {cartItems.length} {cartItems.length === 1 ? "service" : "services"} in cart
                      </p>
                      <p className="text-xs text-muted-foreground">Ready to view cart</p>
                    </div>
                  </div>
                  <Button onClick={handleCheckout} size="sm" className="h-8 text-xs text-white bg-accent hover:bg-accent/90">
                    Proceed to Cart
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
