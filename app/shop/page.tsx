"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { SERVICE_TYPES } from "@/lib/constants"
import type { ServiceType, Listing, CartItem } from "@/lib/types"
import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { serviceCategories } from "@/components/shop/service-category-tabs"
import { ListingsGrid } from "@/components/shop/listings-grid"
import { 
  Search, 
  ShoppingCart, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  SortAsc, 
  SortDesc,
  MapPin,
  Star,
  Clock,
  Users,
  Zap,
  TrendingUp,
  RefreshCw,
  Heart,
  Share2,
  Eye,
  X
} from "lucide-react"

type SortOption = 'price_low' | 'price_high' | 'rating' | 'newest' | 'popular' | 'name'

interface FilterState {
  priceRange: [number, number]
  locations: string[]
  vendors: string[]
  availability: boolean
  verifiedOnly: boolean
}

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<ServiceType>("accommodation")
  const [listings, setListings] = useState<Record<ServiceType, Listing[]>>({
    accommodation: [],
    car_hire: [],
    tour: [],
    cinema: [],
    event: [],
  })
  const [categoryCounts, setCategoryCounts] = useState<Record<ServiceType, number | null>>({
    accommodation: null,
    car_hire: null,
    tour: null,
    cinema: null,
    event: null,
  })
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartLoadingStates, setCartLoadingStates] = useState<Record<string, boolean>>({})
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 1000],
    locations: [],
    vendors: [],
    availability: false,
    verifiedOnly: false
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalListings: 0,
    totalVendors: 0,
    averageRating: 0,
    totalBookings: 0
  })
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [availableVendors, setAvailableVendors] = useState<string[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAllListings()
    loadCart()
    loadStats()
    loadFavorites()
    loadRecentlyViewed()
    loadAllCategoryCounts()
  }, [])

  useEffect(() => {
    // Load listings for the active tab when it changes
    loadListingsForTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    // Update available filter options when listings change
    const currentListings = listings[activeTab]
    const locations = [...new Set(currentListings.map(l => l.location))].sort()
    const vendors = [...new Set(currentListings.map(l => l.vendor?.business_name).filter(Boolean))].sort()
    
    setAvailableLocations(locations)
    setAvailableVendors(vendors)
    
    // Update price range based on current listings
    if (currentListings.length > 0) {
      const prices = currentListings.map(l => l.price)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      setFilters(prev => ({
        ...prev,
        priceRange: [minPrice, maxPrice]
      }))
    }
  }, [listings, activeTab])

  const loadAllCategoryCounts = async () => {
    try {
      const counts: Record<ServiceType, number> = {
        accommodation: 0,
        car_hire: 0,
        tour: 0,
        cinema: 0,
        event: 0,
      }

      // Load counts for all categories in parallel
      const promises = serviceCategories.map(async (category) => {
        const { data, error } = await supabase
          .from('listings')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
          .eq('service_type', category.type)
        
        if (!error && data) {
          counts[category.type] = data.length
        }
      })

      await Promise.all(promises)
      setCategoryCounts(counts)
    } catch (error) {
      console.error('Error loading category counts:', error)
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setStats(json.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const updateStatsForTab = async (tab: ServiceType) => {
    try {
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id')
        .eq('is_active', true)
        .eq('service_type', tab)
      
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id')
        .eq('is_verified', true)
      
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'confirmed')
      
      setStats(prev => ({
        ...prev,
        totalListings: listingsData?.length || 0,
        totalVendors: vendorsData?.length || 0,
        totalBookings: bookingsData?.length || 0
      }))
    } catch (error) {
      console.error('Error updating stats for tab:', error)
    }
  }

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id)
      
      if (data) {
        setFavorites(new Set(data.map(f => f.listing_id)))
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const loadRecentlyViewed = () => {
    try {
      const viewed = localStorage.getItem('recentlyViewed')
      if (viewed) {
        setRecentlyViewed(JSON.parse(viewed))
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
    }
  }

  const addToRecentlyViewed = (listingId: string) => {
    setRecentlyViewed(prev => {
      const updated = [listingId, ...prev.filter(id => id !== listingId)].slice(0, 10)
      localStorage.setItem('recentlyViewed', JSON.stringify(updated))
      return updated
    })
  }

  const toggleFavorite = async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const isFavorited = favorites.has(listingId)
      
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
        
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(listingId)
          return newSet
        })
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: listingId
          })
        
        setFavorites(prev => new Set([...prev, listingId]))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const loadAllListings = async () => {
    setIsLoading(true)
    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          *,
          vendor:vendors(id, business_name, wallet_address, is_verified)
        `,
        )
        .eq("is_active", true)
        .eq("service_type", activeTab)

      if (listingsError) throw listingsError

      const availabilityResponse = await fetch(`/api/ticket-availability?service_type=${activeTab}`)
      const availabilityData = await availabilityResponse.json()

      if (!availabilityData.success) {
        throw new Error('Failed to fetch ticket availability')
      }

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
        [activeTab]: listingsWithAvailability as Listing[]
      }))
    } catch (error) {
      console.error("Error loading listings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadListingsForTab = async (tab: ServiceType) => {
    if (listings[tab].length > 0) return
    
    setIsLoading(true)
    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(
          `
          *,
          vendor:vendors(id, business_name, wallet_address, is_verified)
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

    if (cartLoadingStates[listing.id]) return

    setCartLoadingStates(prev => ({ ...prev, [listing.id]: true }))

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
        booking_date: new Date().toISOString(), // Set current date as default booking date
        is_gift: false
      }])
    }

    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .eq("is_gift", false) // Only match non-gift items for regular cart
        .limit(1)
        .maybeSingle()
      
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id)
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          listing_id: listing.id,
          quantity: 1,
          booking_date: new Date().toISOString(), // Set booking date when inserting
        })
      }
      
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
      await loadCart()
    } finally {
      setCartLoadingStates(prev => ({ ...prev, [listing.id]: false }))
    }
  }, [cartItems, cartLoadingStates, supabase, router])

  const handleRemoveFromCart = useCallback(async (listing: Listing) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (cartLoadingStates[listing.id]) return

    setCartLoadingStates(prev => ({ ...prev, [listing.id]: true }))

    setCartItems(prev => prev.filter(item => item.listing.id !== listing.id))
    
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .eq("is_gift", false) // Only remove non-gift items
      
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (error) {
      console.error("Error removing from cart:", error)
      await loadCart()
    } finally {
      setCartLoadingStates(prev => ({ ...prev, [listing.id]: false }))
    }
  }, [cartLoadingStates, supabase])

  const handleCheckout = () => {
    router.push("/cart")
  }

  // Advanced filtering and sorting
  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings[activeTab].filter((listing) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Price filter
      const matchesPrice = listing.price >= filters.priceRange[0] && listing.price <= filters.priceRange[1]

      // Location filter
      const matchesLocation = filters.locations.length === 0 || filters.locations.includes(listing.location)

      // Vendor filter
      const matchesVendor = filters.vendors.length === 0 || 
        (listing.vendor?.business_name && filters.vendors.includes(listing.vendor.business_name))

      // Availability filter
      const matchesAvailability = !filters.availability || listing.remaining_tickets > 0

      // Verified only filter
      const matchesVerified = !filters.verifiedOnly || listing.vendor?.is_verified

      return matchesSearch && matchesPrice && matchesLocation && matchesVendor && matchesAvailability && matchesVerified
    })

    // Sort listings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'popular':
          return (b.booked_tickets || 0) - (a.booked_tickets || 0)
        case 'name':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [listings, activeTab, searchQuery, filters, sortBy])

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      locations: [],
      vendors: [],
      availability: false,
      verifiedOnly: false
    })
    setSearchQuery('')
  }

  const currentIndex = serviceCategories.findIndex((cat) => cat.type === activeTab)
  const nextCategory = serviceCategories[currentIndex + 1]
  const activeCategory = serviceCategories[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Enhanced Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="px-3 py-1.5" style={{backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6'}}>
              <Zap className="w-3 h-3 mr-1" />
              Multi-Service Booking
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5">
              <TrendingUp className="w-3 h-3 mr-1" />
              {stats.totalListings} Services
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Explore <span className="text-accent hover:text-accent/80 transition-colors cursor-pointer">Services</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Browse from multiple service providers. Add everything to your cart and checkout once.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-accent/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{stats.totalListings}</div>
                <div className="text-sm text-muted-foreground">Total Services</div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{stats.totalVendors}</div>
                <div className="text-sm text-muted-foreground">Verified Providers</div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{stats.averageRating}</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </CardContent>
            </Card>
            <Card className="border-accent/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{stats.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar - More compact */}
            <div className="relative lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Search ${SERVICE_TYPES[activeTab]}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm"
              />
            </div>
            
            {/* Filter and Sort Controls - More compact */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-10 px-3 text-sm"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
                {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f) && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>
              
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="h-10 w-32 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Advanced Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <div className="space-y-2">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                        max={1000}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${filters.priceRange[0]}</span>
                        <span>${filters.priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Locations</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableLocations.map(location => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location}`}
                            checked={filters.locations.includes(location)}
                            onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                ...prev,
                                locations: checked 
                                  ? [...prev.locations, location]
                                  : prev.locations.filter(l => l !== location)
                              }))
                            }}
                          />
                          <label htmlFor={`location-${location}`} className="text-sm">
                            {location}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Filters */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Other Filters</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="availability"
                          checked={filters.availability}
                          onCheckedChange={(checked) => setFilters(prev => ({ ...prev, availability: !!checked }))}
                        />
                        <label htmlFor="availability" className="text-sm">Available Now</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="verified"
                          checked={filters.verifiedOnly}
                          onCheckedChange={(checked) => setFilters(prev => ({ ...prev, verifiedOnly: !!checked }))}
                        />
                        <label htmlFor="verified" className="text-sm">Verified Only</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Tabs Navigation */}
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
                {categoryCounts[category.type] !== null && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {categoryCounts[category.type]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {serviceCategories.map((category) => (
            <TabsContent key={category.type} value={category.type} className="space-y-8">
              {/* Enhanced Category Header */}
              <Card className="border-2 border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{SERVICE_TYPES[category.type]}</h2>
                      <p className="text-muted-foreground mb-4">{category.description}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge variant="secondary" className="text-sm">
                          {filteredAndSortedListings.length} {filteredAndSortedListings.length === 1 ? "service" : "services"} available
                        </Badge>
                        {cartItems.length > 0 && (
                          <Badge className="text-sm">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            {cartItems.length} in cart
                          </Badge>
                        )}
                        {favorites.size > 0 && (
                          <Badge variant="outline" className="text-sm">
                            <Heart className="w-3 h-3 mr-1" />
                            {favorites.size} favorites
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAllListings()}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Listings Grid */}
              <ListingsGrid 
                listings={filteredAndSortedListings} 
                isLoading={isLoading} 
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                cartItems={cartItems}
                cartLoadingStates={cartLoadingStates}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onViewListing={(listing) => {
                  addToRecentlyViewed(listing.id)
                  router.push(`/listing/${listing.id}`)
                }}
              />

              {/* Enhanced Navigation Footer */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredAndSortedListings.length} of {listings[category.type]?.length || 0} {SERVICE_TYPES[category.type].toLowerCase()}
                      </p>
                      {searchQuery && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Results for "{searchQuery}"
                        </p>
                      )}
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

        {/* Enhanced Empty State */}
        {!isLoading && filteredAndSortedListings.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters or browse other categories'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Bottom CTA */}
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
                      <p className="text-xs text-muted-foreground">Ready to checkout</p>
                    </div>
                  </div>
                  <Button onClick={handleCheckout} size="sm" className="h-8">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    View Cart
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