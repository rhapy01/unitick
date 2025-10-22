"use client"

import { Header } from "@/components/header"
import { ServiceCard } from "@/components/service-card"
import { ServiceFilters } from "@/components/service-filters"
import { createClient } from "@/lib/supabase/client"
import type { Listing, ServiceType } from "@/lib/types"
import { SERVICE_TYPES } from "@/lib/constants"
import { useEffect, useState } from "react"
import { use } from "react"
import { useToast } from "@/hooks/use-toast"

export default function BrowsePage({ params }: { params: Promise<{ serviceType: ServiceType }> }) {
  const { serviceType } = use(params)
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [location, setLocation] = useState<any>({})
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [locationStats, setLocationStats] = useState<any>(null)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true)
      try {
        // Use the new location-based search API
        const searchParams = new URLSearchParams({
          serviceType,
          sortBy,
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(verifiedOnly && { verifiedOnly: 'true' }),
          ...(location.country && { country: location.country }),
          ...(location.state && { state: location.state }),
          ...(location.city && { city: location.city }),
          ...(location.lat && { lat: location.lat.toString() }),
          ...(location.lng && { lng: location.lng.toString() }),
          ...(location.radius && { radius: location.radius.toString() })
        })

        const response = await fetch(`/api/listings/search?${searchParams}`)
        const data = await response.json()

        if (data.success) {
          setListings(data.listings)
          setFilteredListings(data.listings)
        } else {
          throw new Error(data.error)
        }
      } catch (error) {
        console.error("[Browse] Error fetching listings:", error)
        toast({
          title: "Error",
          description: "Failed to load listings",
          variant: "destructive",
        })
        
        // Fallback to original method
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("listings")
          .select("*, vendor:vendors(*)")
          .eq("service_type", serviceType)
          .eq("is_active", true)

        if (fallbackError) {
          console.error("[Browse] Fallback error:", fallbackError)
        } else {
          setListings(fallbackData || [])
          setFilteredListings(fallbackData || [])
        }
      }
      setIsLoading(false)
    }

    fetchListings()
  }, [serviceType, sortBy, minPrice, maxPrice, verifiedOnly, location, supabase, toast])

  useEffect(() => {
    let filtered = [...listings]

    // Apply search query filter (client-side for now)
    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredListings(filtered)
  }, [listings, searchQuery])

  // Load location stats when location changes
  useEffect(() => {
    const loadLocationStats = async () => {
      if (!location.country && !location.state && !location.city) {
        setLocationStats(null)
        return
      }

      try {
        const searchParams = new URLSearchParams({
          type: 'stats',
          ...(location.country && { country: location.country }),
          ...(location.state && { state: location.state }),
          ...(location.city && { city: location.city })
        })

        const response = await fetch(`/api/location/data?${searchParams}`)
        const data = await response.json()

        if (data.success) {
          setLocationStats(data.stats)
        }
      } catch (error) {
        console.error("[Browse] Error loading location stats:", error)
      }
    }

    loadLocationStats()
  }, [location])

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{SERVICE_TYPES[serviceType]}</h1>
          <p className="text-muted-foreground">
            Browse and book {SERVICE_TYPES[serviceType].toLowerCase()} with crypto
          </p>
        </div>

        <ServiceFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          location={location}
          onLocationChange={setLocation}
          verifiedOnly={verifiedOnly}
          onVerifiedOnlyChange={setVerifiedOnly}
          showLocationFilter={true}
        />

        {/* Location Stats */}
        {locationStats && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">Location Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Listings:</span>
                <span className="ml-1 font-medium">{locationStats.total_listings}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Vendors:</span>
                <span className="ml-1 font-medium">{locationStats.total_vendors}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Price:</span>
                <span className="ml-1 font-medium">${locationStats.avg_price?.toFixed(2) || '0'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Price Range:</span>
                <span className="ml-1 font-medium">
                  ${locationStats.min_price?.toFixed(2) || '0'} - ${locationStats.max_price?.toFixed(2) || '0'}
                </span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-card border border-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No listings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ServiceCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
