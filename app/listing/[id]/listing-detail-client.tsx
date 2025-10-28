"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Listing, CartItem } from "@/lib/types"
import { SERVICE_TYPES, PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"
import { useEffect, useState } from "react"
import { MapPin, Calendar, Users, ShoppingCart, ChevronLeft, ChevronRight, Clock, AlertCircle, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sanitizeUserInput, sanitizePrice, sanitizeQuantity } from "@/lib/sanitize"
import { useToast } from "@/hooks/use-toast"

interface ListingDetailClientProps {
  listing: Listing & {
    vendors: {
      id: string
      company_name: string
      physical_address: string
      logo_url?: string
      description: string
    }
  }
}

export function ListingDetailClient({ listing }: ListingDetailClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createClient()

  const images = listing.images || []
  const totalPrice = listing.price * quantity
  const platformFee = totalPrice * PLATFORM_FEE_PERCENTAGE
  const finalPrice = totalPrice + platformFee

  const handleShare = async () => {
    try {
      const url = window.location.href
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

  const handleAddToCart = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a date for your booking.",
        variant: "destructive",
      })
      return
    }

    setIsAddingToCart(true)

    try {
      const cartItem: CartItem = {
        listing_id: listing.id,
        quantity,
        selected_date: selectedDate,
        selected_time: selectedTime,
        price: listing.price,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          location: listing.location,
          service_type: listing.service_type,
          images: listing.images,
          vendor: listing.vendors,
        },
      }

      const { error } = await supabase.from("cart_items").insert([cartItem])

      if (error) {
        throw error
      }

      toast({
        title: "Added to Cart",
        description: `${sanitizeUserInput(listing.title)} has been added to your cart.`,
      })

      // Dispatch custom event to update cart count
      window.dispatchEvent(new CustomEvent("cartUpdated"))
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => router.back()} className="hover:text-foreground">
              ← Back
            </button>
            <span>/</span>
            <span>{SERVICE_TYPES[listing.service_type]}</span>
            <span>/</span>
            <span className="text-foreground">{sanitizeUserInput(listing.title)}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={sanitizeUserInput(listing.title)}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                        currentImageIndex === index ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${sanitizeUserInput(listing.title)} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {SERVICE_TYPES[listing.service_type]}
                </Badge>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold">{sanitizeUserInput(listing.title)}</h1>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{sanitizeUserInput(listing.location)}</span>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {sanitizeUserInput(listing.description)}
                </p>
              </div>

              {/* Vendor Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {listing.vendors.logo_url && (
                      <img
                        src={listing.vendors.logo_url}
                        alt={sanitizeUserInput(listing.vendors.company_name)}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{sanitizeUserInput(listing.vendors.company_name)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {sanitizeUserInput(listing.vendors.physical_address)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Form */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Select Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {listing.amenities && listing.amenities.length > 0 && (
                      <div>
                        <Label htmlFor="time">Select Time</Label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a time" />
                          </SelectTrigger>
                          <SelectContent>
                            {listing.amenities.map((amenity) => (
                              <SelectItem key={amenity} value={amenity}>
                                {amenity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: Math.min(10, listing.capacity || 10) }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between">
                        <span>Price per unit:</span>
                        <span>${sanitizePrice(listing.price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>{sanitizeQuantity(quantity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${sanitizePrice(totalPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Platform fee ({(PLATFORM_FEE_PERCENTAGE * 100).toFixed(1)}%):</span>
                        <span>${sanitizePrice(platformFee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>${sanitizePrice(finalPrice).toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="w-full h-12"
                      size="lg"
                    >
                      {isAddingToCart ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Adding to Cart...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
