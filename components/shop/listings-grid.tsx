"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Check, Users, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { Listing, CartItem } from "@/lib/types"
import { sanitizeUserInput, sanitizePrice } from "@/lib/sanitize"
import { useState } from "react"

interface ListingsGridProps {
  listings: Listing[]
  isLoading: boolean
  onAddToCart: (listing: Listing) => void
  onRemoveFromCart: (listing: Listing) => void
  cartItems: CartItem[]
  cartLoadingStates: Record<string, boolean>
}

export function ListingsGrid({ listings, isLoading, onAddToCart, onRemoveFromCart, cartItems, cartLoadingStates }: ListingsGridProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({})

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
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-48 bg-muted rounded-lg mb-4" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No listings available in this category yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {listings.map((listing) => {
        const images = listing.images || []
        const currentIndex = currentImageIndex[listing.id] || 0
        const currentImage = images[currentIndex] || `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(listing.title)}`
        const hasMultipleImages = images.length > 1

        // Check if this listing is in the cart
        const cartItem = cartItems.find(item => item.listing.id === listing.id)
        const isInCart = !!cartItem
        const isLoading = cartLoadingStates[listing.id] || false

        // Get availability info
        const remainingTickets = (listing as any).remaining_tickets || 0
        const totalTickets = (listing as any).total_tickets || (listing as any).capacity || 0
        const isSoldOut = (listing as any).is_sold_out || remainingTickets === 0
        const isLowStock = remainingTickets > 0 && remainingTickets <= 5

        return (
          <Card key={listing.id} className={`overflow-hidden transition-colors ${
            isSoldOut 
              ? 'opacity-60 border-red-200 dark:border-red-800' 
              : 'hover:border-primary'
          }`}>
            <div className="h-48 overflow-hidden bg-muted relative group">
              <img
                src={currentImage}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Image Navigation Arrows - Only show if multiple images */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => handleImageNavigation(listing.id, 'prev', images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation(listing.id, 'next', images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Image Indicators - Only show if multiple images */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-primary' : 'bg-primary/50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Availability Badge */}
              <div className="absolute top-2 right-2">
                {isSoldOut ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Sold Out
                  </Badge>
                ) : isLowStock ? (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    <Users className="w-3 h-3 mr-1" />
                    Only {remainingTickets} left
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {remainingTickets} available
                  </Badge>
                )}
              </div>

              {/* Image Count Badge - Only show if multiple images */}
              {hasMultipleImages && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs bg-black/50 text-white">
                    {currentIndex + 1}/{images.length}
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{sanitizeUserInput(listing.title)}</h3>
                <Badge variant="secondary">${sanitizePrice(listing.price).toFixed(2)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sanitizeUserInput(listing.description)}</p>
              <p className="text-sm text-muted-foreground mb-4">📍 {sanitizeUserInput(listing.location)}</p>
              
              {/* Availability Info */}
              <div className="mb-4 p-2 bg-muted/50 rounded-md">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tickets Available:</span>
                  <span className="font-medium">
                    {remainingTickets} / {totalTickets}
                  </span>
                </div>
                {totalTickets > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        isSoldOut ? 'bg-red-500' : 
                        isLowStock ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(0, (remainingTickets / totalTickets) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              {isInCart ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 gradient:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      In Cart ({cartItem.quantity}x)
                    </span>
                  </div>
                  <Button 
                    onClick={() => onRemoveFromCart(listing)} 
                    variant="outline" 
                    className="w-full bg-accent text-white hover:bg-accent/90 border-accent" 
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Minus className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Removing...' : 'Remove from Cart'}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => onAddToCart(listing)} 
                  className="w-full bg-accent text-white hover:bg-accent/90" 
                  size="sm"
                  disabled={isSoldOut || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? 'Adding...' : isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
