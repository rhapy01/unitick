"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Check, Users, AlertCircle, ChevronLeft, ChevronRight, Loader2, Heart, Share2, Eye, Star, MapPin, Clock } from "lucide-react"
import type { Listing, CartItem } from "@/lib/types"
import { sanitizeUserInput, sanitizePrice } from "@/lib/sanitize"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ListingsGridProps {
  listings: Listing[]
  isLoading: boolean
  onAddToCart: (listing: Listing) => void
  onRemoveFromCart: (listing: Listing) => void
  cartItems: CartItem[]
  cartLoadingStates: Record<string, boolean>
  favorites?: Set<string>
  onToggleFavorite?: (listingId: string) => void
  onViewListing?: (listing: Listing) => void
}

export function ListingsGrid({ 
  listings, 
  isLoading, 
  onAddToCart, 
  onRemoveFromCart, 
  cartItems, 
  cartLoadingStates,
  favorites = new Set(),
  onToggleFavorite,
  onViewListing
}: ListingsGridProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({})
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const { toast } = useToast()

  const handleImageNavigation = (listingId: string, direction: 'prev' | 'next', totalImages: number) => {
    setCurrentImageIndex(prev => {
      const currentIndex = prev[listingId] || 0
      let newIndex = currentIndex
      
      if (direction === 'prev') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalImages - 1
      } else {
        newIndex = currentIndex < totalImages - 1 ? currentIndex + 1 : 0
      }
      
      return { ...prev, [listingId]: newIndex }
    })
  }

  const getCartItem = (listingId: string) => {
    return cartItems.find(item => item.listing.id === listingId)
  }

  const handleShare = async (listing: Listing) => {
    try {
      const url = `${window.location.origin}/listing/${listing.id}`
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link Copied!",
        description: "Listing link has been copied to your clipboard.",
        duration: 2000,
      })
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="bg-muted rounded-lg h-48 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => {
        const images = listing.images || []
        const currentImage = currentImageIndex[listing.id] || 0
        const cartItem = getCartItem(listing.id)
        const isFavorited = favorites.has(listing.id)
        const isSoldOut = listing.is_sold_out || listing.remaining_tickets === 0
        const isLowStock = listing.remaining_tickets !== undefined && listing.remaining_tickets < 10 && listing.remaining_tickets > 0
        const totalTickets = (listing.remaining_tickets || 0) + (listing.booked_tickets || 0)

        return (
          <Card 
            key={listing.id} 
            className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/20 hover:-translate-y-1"
            onMouseEnter={() => setHoveredCard(listing.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardContent className="p-0">
              {/* Image Section */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImage]}
                      alt={sanitizeUserInput(listing.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {images.length > 1 && (
                <>
                  <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleImageNavigation(listing.id, 'prev', images.length)
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleImageNavigation(listing.id, 'next', images.length)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {onToggleFavorite && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(listing.id)
                          }}
                        >
                          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShare(listing)
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                </div>
              )}

                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {isSoldOut && (
                  <Badge variant="destructive" className="text-xs">
                    Sold Out
                  </Badge>
                  )}
                  {isLowStock && !isSoldOut && (
                    <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                      Low Stock
                  </Badge>
                  )}
                  {listing.vendor?.is_verified && (
                    <Badge variant="outline" className="text-xs bg-white/90 text-black">
                      <Check className="h-2 w-2 mr-1" />
                      Verified
                  </Badge>
                )}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-accent transition-colors">
                    {sanitizeUserInput(listing.title)}
                  </h3>
                  <Badge variant="secondary" className="text-sm shrink-0">
                    ${sanitizePrice(listing.price).toFixed(2)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{sanitizeUserInput(listing.location)}</span>
            </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {sanitizeUserInput(listing.description)}
                </p>
              
              {/* Availability Info */}
                {listing.remaining_tickets !== undefined && (
              <div className="mb-4 p-2 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tickets Available:</span>
                  <span className="font-medium">
                        {listing.remaining_tickets} / {totalTickets}
                  </span>
                </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        isSoldOut ? 'bg-red-500' : 
                        isLowStock ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                        style={{ width: `${Math.max(0, (listing.remaining_tickets / totalTickets) * 100)}%` }}
                    ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewListing?.(listing)}
                    className="flex-1 mr-2"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  
                  {isSoldOut ? (
                    <Badge variant="destructive" className="text-xs">
                      Sold Out
                    </Badge>
                  ) : cartItem ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveFromCart(listing)}
                        disabled={cartLoadingStates[listing.id]}
                        className="h-8 w-8 p-0"
                      >
                        {cartLoadingStates[listing.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </Button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {cartItem.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddToCart(listing)}
                        disabled={cartLoadingStates[listing.id]}
                        className="h-8 w-8 p-0"
                      >
                        {cartLoadingStates[listing.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                  </Button>
                </div>
              ) : (
                <Button 
                      size="sm"
                  onClick={() => onAddToCart(listing)} 
                      disabled={cartLoadingStates[listing.id]}
                >
                      {cartLoadingStates[listing.id] ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}