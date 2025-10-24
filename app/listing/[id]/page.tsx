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
import { use } from "react"
import { MapPin, Calendar, Users, ShoppingCart, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sanitizeUserInput, sanitizePrice, sanitizeQuantity } from "@/lib/sanitize"

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    const fetchListing = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from("listings").select("*, vendor:vendors(*)").eq("id", id).single()

      if (error) {
        console.error("[v0] Error fetching listing:", error)
      } else {
        setListing(data)
        if (data.available_dates && data.available_dates.length > 0) {
          setSelectedDate(data.available_dates[0])
        }
        if (data.available_times && data.available_times.length > 0) {
          setSelectedTime(data.available_times[0])
        }
      }
      setIsLoading(false)
    }

    fetchListing()
  }, [id, supabase])

  const handleAddToCart = () => {
    if (!listing) return

    const bookingDateTime =
      selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : selectedDate || new Date().toISOString()

    const cart = localStorage.getItem("cart")
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : []

    cartItems.push({
      listing,
      quantity,
      booking_date: bookingDateTime,
    })

    localStorage.setItem("cart", JSON.stringify(cartItems))

    window.dispatchEvent(new Event("cartUpdated"))

    router.push("/cart")
  }

  const handlePrevImage = () => {
    if (!listing?.images || listing.images.length === 0) return
    setCurrentImageIndex((prev) => (prev === 0 ? listing.images!.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    if (!listing?.images || listing.images.length === 0) return
    setCurrentImageIndex((prev) => (prev === listing.images!.length - 1 ? 0 : prev + 1))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-card rounded-lg mb-8" />
            <div className="h-8 bg-card rounded w-1/2 mb-4" />
            <div className="h-4 bg-card rounded w-1/4 mb-8" />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Listing not found</p>
        </div>
      </div>
    )
  }

  const hasImages = listing.images && listing.images.length > 0
  const currentImage = hasImages
    ? listing.images![currentImageIndex]
    : `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(listing.title)}`

  const subtotal = listing.price * quantity
  const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE
  const total = subtotal + platformFee

  const canAddToCart = listing.available_dates ? selectedDate !== "" : true

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video relative overflow-hidden bg-muted rounded-lg mb-6 group">
              <img
                src={currentImage || "/placeholder.svg"}
                alt={listing.title}
                className="object-cover w-full h-full"
              />

              {hasImages && listing.images!.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {listing.images!.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? "bg-primary" : "bg-primary/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{sanitizeUserInput(listing.title)}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{sanitizeUserInput(listing.location)}</span>
                  </div>
                </div>
                <Badge variant="secondary">{SERVICE_TYPES[listing.service_type]}</Badge>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold">${sanitizePrice(listing.price).toFixed(2)}</span>
                <span className="text-muted-foreground">
                  / {listing.service_type === "accommodation" ? "night" : "booking"}
                </span>
              </div>

              <div className="prose prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground">{sanitizeUserInput(listing.description)}</p>
              </div>

              {listing.cancellation_days !== null && (
                <div className="mt-6 p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Cancellation Policy</h3>
                      <p className="text-sm text-muted-foreground">
                        {listing.cancellation_days === 0
                          ? "No cancellations allowed"
                          : `Free cancellation up to ${listing.cancellation_days} day${listing.cancellation_days > 1 ? "s" : ""} before the booking date`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {sanitizeUserInput(amenity)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {listing.capacity && (
                <div className="mt-6 flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Capacity: {sanitizeQuantity(listing.capacity)} people</span>
                </div>
              )}
            </div>

            {listing.vendor && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-3">Vendor Information</h2>
                  <div className="space-y-2">
                    <p className="font-medium">{sanitizeUserInput(listing.vendor.business_name)}</p>
                    {listing.vendor.description && (
                      <p className="text-sm text-muted-foreground">{sanitizeUserInput(listing.vendor.description)}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{sanitizeUserInput(listing.vendor.contact_email)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Book Now</h2>

                <div className="space-y-4 mb-6">
                  {listing.available_dates && listing.available_dates.length > 0 && (
                    <div>
                      <Label htmlFor="selectedDate" className="mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Select Date
                      </Label>
                      <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger id="selectedDate">
                          <SelectValue placeholder="Choose a date" />
                        </SelectTrigger>
                        <SelectContent>
                          {listing.available_dates.map((date) => (
                            <SelectItem key={date} value={date}>
                              {new Date(date).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {listing.available_times && listing.available_times.length > 0 && (
                    <div>
                      <Label htmlFor="selectedTime" className="mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Select Time
                      </Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger id="selectedTime">
                          <SelectValue placeholder="Choose a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {listing.available_times.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="quantity" className="mb-2 block">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${sanitizePrice(subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee (0.2%)</span>
                    <span>${sanitizePrice(platformFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${sanitizePrice(total).toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full bg-accent text-white hover:bg-accent/90" size="lg" onClick={handleAddToCart} disabled={!canAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Payment will be processed with cryptocurrency. Earn Unila Miles with every booking!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
