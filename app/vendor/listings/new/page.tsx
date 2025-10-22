"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { ServiceType } from "@/lib/types"
import { SERVICE_TYPES } from "@/lib/constants"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  DollarSign,
  Users,
  FileText,
  Image as ImageIcon,
  Grid3x3,
  Settings,
  Sparkles,
  Plus,
  Check,
  Building2,
  Film,
  Compass,
  Car,
  Bed,
  Ticket,
  User,
  Shield,
  Fuel,
  CreditCard
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function NewListingPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [allowedCategories, setAllowedCategories] = useState<ServiceType[]>([])
  const [serviceType, setServiceType] = useState<ServiceType | "">("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [price, setPrice] = useState("")
  const [capacity, setCapacity] = useState("")
  const [totalTickets, setTotalTickets] = useState("")
  const [amenities, setAmenities] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [newDate, setNewDate] = useState("")
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [newStartTime, setNewStartTime] = useState("")
  const [newDuration, setNewDuration] = useState<string>("60")
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours">("minutes")
  const [mapUrl, setMapUrl] = useState("")
  const [cancellationDays, setCancellationDays] = useState("7")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Category-specific form fields
  const [categoryFields, setCategoryFields] = useState<Record<string, any>>({})
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkVendor = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user has vendor role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profileData || profileData.role !== "vendor") {
        router.push("/dashboard")
        return
      }

      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id, categories")
        .eq("user_id", user.id)
        .single()

      if (!vendorData) {
        router.push("/vendor/setup")
        return
      }

      setVendorId(vendorData.id)
      setAllowedCategories(vendorData.categories || [])

      if (vendorData.categories && vendorData.categories.length > 0) {
        setServiceType(vendorData.categories[0])
      }
    }

    checkVendor()
  }, [router, supabase])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the 5 image limit
    const totalImages = images.length + files.length
    if (totalImages > 5) {
      setError(`You can only upload up to 5 images. You currently have ${images.length} images and are trying to add ${files.length} more.`)
      toast({
        title: "Too Many Images",
        description: "Maximum 5 images allowed per listing",
        variant: "destructive",
      })
      return
    }

    // Check file sizes (1MB = 1,048,576 bytes)
    const maxSize = 1 * 1024 * 1024 // 1MB in bytes
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ')
      setError(`The following files are too large (max 1MB each): ${fileNames}`)
      toast({
        title: "File Too Large",
        description: "Each image must be smaller than 1MB",
        variant: "destructive",
      })
      return
    }

    setUploadingImages(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          const message = (data && (data.error || data.message)) || "Failed to upload image"
          throw new Error(message)
        }

        uploadedUrls.push(data.url)
      }

      setImages((prev) => [...prev, ...uploadedUrls])
      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("[v0] Error uploading images:", error)
      const errorMsg = "Failed to upload images. Please try again."
      setError(errorMsg)
      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddDate = () => {
    if (newDate && !availableDates.includes(newDate)) {
      setAvailableDates((prev) => [...prev, newDate].sort())
      setNewDate("")
    }
  }

  const handleRemoveDate = (date: string) => {
    setAvailableDates((prev) => prev.filter((d) => d !== date))
  }

  const handleAddTime = () => {
    if (!newStartTime) return
    const raw = parseInt(newDuration, 10)
    const durationNum = isNaN(raw) ? 60 : raw
    const minutes = durationUnit === "hours" ? durationNum * 60 : durationNum
    const label = `${newStartTime}|${minutes}`
    if (!availableTimes.includes(label)) {
      setAvailableTimes((prev) => [...prev, label].sort())
    }
    setNewStartTime("")
    setNewDuration("60")
    setDurationUnit("minutes")
  }

  const handleRemoveTime = (time: string) => {
    setAvailableTimes((prev) => prev.filter((t) => t !== time))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId || !serviceType) return

    if (!allowedCategories.includes(serviceType)) {
      const errorMsg = "You can only create listings in your selected categories"
      setError(errorMsg)
      toast({
        title: "Invalid Category",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate numeric fields
      const capacityNum = Number.parseInt(capacity, 10)
      const ticketsNum = Number.parseInt(totalTickets, 10)
      const priceNum = Number.parseFloat(price)
      const cancellationDaysNum = Number.parseInt(cancellationDays, 10)

      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("Price cannot be negative")
      }
      if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
        throw new Error("Capacity must be a positive number")
      }
      if (!Number.isFinite(ticketsNum) || ticketsNum <= 0) {
        throw new Error("Total tickets must be a positive number")
      }
      if (ticketsNum > capacityNum) {
        throw new Error("Total tickets cannot exceed capacity")
      }

      const amenitiesArray = amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a)

      const { error: listingError } = await supabase.from("listings").insert({
        vendor_id: vendorId,
        service_type: serviceType,
        title,
        description,
        location,
        map_url: mapUrl || null,
        price: priceNum,
        capacity: capacityNum,
        total_tickets: ticketsNum,
        amenities: amenitiesArray,
        images: images,
        available_dates: availableDates.length > 0 ? availableDates : null,
        available_times: availableTimes.length > 0 ? availableTimes : null,
        cancellation_days: Number.isFinite(cancellationDaysNum) ? cancellationDaysNum : null,
        category_specific_data: categoryFields, // Store category-specific data
        is_active: true,
      })

      if (listingError) throw listingError

      toast({
        title: "Success",
        description: "Listing created successfully! You earned 20 Unila Miles! 🎉",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error creating listing:", error)
      const errorMsg = error instanceof Error ? error.message : "Failed to create listing"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Category-specific form components
  const renderCategorySpecificForm = () => {
    if (!serviceType) return null

    const updateCategoryField = (field: string, value: any) => {
      setCategoryFields(prev => ({ ...prev, [field]: value }))
    }

    switch (serviceType) {
      case 'accommodation':
  return (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bed className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Hotel / Hospitality Details</CardTitle>
                  <CardDescription>Specific information for accommodation listings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Room Types Available</Label>
                <Textarea
                  placeholder="e.g., Standard Room, Deluxe Suite, Presidential Suite"
                  value={categoryFields.roomTypes || ''}
                  onChange={(e) => updateCategoryField('roomTypes', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Price Per Night (USD)</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Standard Room</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-10"
                        value={categoryFields.standardPrice || ''}
                        onChange={(e) => updateCategoryField('standardPrice', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Deluxe Room</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-10"
                        value={categoryFields.deluxePrice || ''}
                        onChange={(e) => updateCategoryField('deluxePrice', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Max Guests Per Room</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Maximum guests"
                    className="pl-10"
                    value={categoryFields.maxGuests || ''}
                    onChange={(e) => updateCategoryField('maxGuests', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Check-in & Check-out Times</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Check-in Time</Label>
                    <Input
                      type="time"
                      value={categoryFields.checkInTime || ''}
                      onChange={(e) => updateCategoryField('checkInTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Check-out Time</Label>
                    <Input
                      type="time"
                      value={categoryFields.checkOutTime || ''}
                      onChange={(e) => updateCategoryField('checkOutTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Number of Rooms Available</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Total rooms"
                    className="pl-10"
                    value={categoryFields.totalRooms || ''}
                    onChange={(e) => updateCategoryField('totalRooms', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'cinema':
        return (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Film className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Cinema / Movie Details</CardTitle>
                  <CardDescription>Specific information for movie listings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Cinema Name</Label>
                <Input
                  placeholder="e.g., Century Cinema, IMAX Theater"
                  value={categoryFields.cinemaName || ''}
                  onChange={(e) => updateCategoryField('cinemaName', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Hall / Screen Number</Label>
                <Input
                  placeholder="e.g., Hall A, Screen 3"
                  value={categoryFields.hallNumber || ''}
                  onChange={(e) => updateCategoryField('hallNumber', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Movie Duration (minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="120"
                    className="pl-10"
                    value={categoryFields.movieDuration || ''}
                    onChange={(e) => updateCategoryField('movieDuration', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Age Rating</Label>
                <Select value={categoryFields.ageRating || ''} onValueChange={(value) => updateCategoryField('ageRating', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">G - General Audiences</SelectItem>
                    <SelectItem value="PG">PG - Parental Guidance</SelectItem>
                    <SelectItem value="PG-13">PG-13 - Parents Strongly Cautioned</SelectItem>
                    <SelectItem value="R">R - Restricted</SelectItem>
                    <SelectItem value="NC-17">NC-17 - Adults Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Showtimes</Label>
                <Textarea
                  placeholder="e.g., 2:00 PM, 5:30 PM, 8:45 PM"
                  value={categoryFields.showtimes || ''}
                  onChange={(e) => updateCategoryField('showtimes', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separate multiple showtimes with commas</p>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Seats Available Per Show</Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Total seats"
                    className="pl-10"
                    value={categoryFields.seatsPerShow || ''}
                    onChange={(e) => updateCategoryField('seatsPerShow', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'tour':
        return (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Compass className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Safari / Tour Details</CardTitle>
                  <CardDescription>Specific information for tour listings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Tour Type</Label>
                <Select value={categoryFields.tourType || ''} onValueChange={(value) => updateCategoryField('tourType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tour type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group Tour</SelectItem>
                    <SelectItem value="private">Private Tour</SelectItem>
                    <SelectItem value="day-trip">Day Trip</SelectItem>
                    <SelectItem value="multi-day">Multi-day Tour</SelectItem>
                    <SelectItem value="safari">Safari</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Pickup Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Hotel lobby, Airport, City center"
                    className="pl-10"
                    value={categoryFields.pickupLocation || ''}
                    onChange={(e) => updateCategoryField('pickupLocation', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Drop-off Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Same as pickup, Different location"
                    className="pl-10"
                    value={categoryFields.dropoffLocation || ''}
                    onChange={(e) => updateCategoryField('dropoffLocation', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Tour Duration</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={categoryFields.tourStartTime || ''}
                      onChange={(e) => updateCategoryField('tourStartTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (hours)</Label>
                    <Input
                      type="number"
                      placeholder="8"
                      value={categoryFields.tourDuration || ''}
                      onChange={(e) => updateCategoryField('tourDuration', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">What's Included</Label>
                <Textarea
                  placeholder="e.g., Transportation, Guide, Lunch, Park fees, Equipment"
                  value={categoryFields.includedItems || ''}
                  onChange={(e) => updateCategoryField('includedItems', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">What to Bring</Label>
                <Textarea
                  placeholder="e.g., Comfortable shoes, Camera, Sunscreen, Water bottle"
                  value={categoryFields.whatToBring || ''}
                  onChange={(e) => updateCategoryField('whatToBring', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Maximum Group Size</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Maximum people"
                    className="pl-10"
                    value={categoryFields.maxGroupSize || ''}
                    onChange={(e) => updateCategoryField('maxGroupSize', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Guide Languages</Label>
                <Input
                  placeholder="e.g., English, Swahili, French"
                  value={categoryFields.guideLanguages || ''}
                  onChange={(e) => updateCategoryField('guideLanguages', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separate languages with commas</p>
              </div>
            </CardContent>
          </Card>
        )

      case 'event':
        return (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Event / Conference Details</CardTitle>
                  <CardDescription>Specific information for event listings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Event Organizer</Label>
                <Input
                  placeholder="e.g., Tech Conference Ltd, Event Management Co"
                  value={categoryFields.organizer || ''}
                  onChange={(e) => updateCategoryField('organizer', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Event Type</Label>
                <Select value={categoryFields.eventType || ''} onValueChange={(value) => updateCategoryField('eventType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="exhibition">Exhibition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Event Date & Time</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Event Date</Label>
                    <Input
                      type="date"
                      value={categoryFields.eventDate || ''}
                      onChange={(e) => updateCategoryField('eventDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={categoryFields.eventTime || ''}
                      onChange={(e) => updateCategoryField('eventTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Ticket Types & Prices</Label>
                <Textarea
                  placeholder="e.g., Early Bird: $50, Regular: $75, VIP: $150"
                  value={categoryFields.ticketTypes || ''}
                  onChange={(e) => updateCategoryField('ticketTypes', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Method of Entry</Label>
                <Select value={categoryFields.entryMethod || ''} onValueChange={(value) => updateCategoryField('entryMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entry method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ticket">Physical Ticket</SelectItem>
                    <SelectItem value="qr-code">QR Code</SelectItem>
                    <SelectItem value="digital">Digital Ticket</SelectItem>
                    <SelectItem value="guest-list">Guest List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Speakers / Performers</Label>
                <Textarea
                  placeholder="e.g., John Doe (CEO), Jane Smith (Speaker), Music Band XYZ"
                  value={categoryFields.speakers || ''}
                  onChange={(e) => updateCategoryField('speakers', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Event Agenda / Schedule</Label>
                <Textarea
                  placeholder="e.g., 9:00 AM - Registration, 10:00 AM - Keynote, 11:30 AM - Break"
                  value={categoryFields.agenda || ''}
                  onChange={(e) => updateCategoryField('agenda', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'car_hire':
        return (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Car Hire / Rental Details</CardTitle>
                  <CardDescription>Specific information for car rental listings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Car Make & Model</Label>
                <Input
                  placeholder="e.g., Toyota Camry, Honda Civic, BMW X5"
                  value={categoryFields.carModel || ''}
                  onChange={(e) => updateCategoryField('carModel', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Car Type</Label>
                <Select value={categoryFields.carType || ''} onValueChange={(value) => updateCategoryField('carType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select car type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="mid-size">Mid-size</SelectItem>
                    <SelectItem value="full-size">Full-size</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Price Per Day (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    value={categoryFields.pricePerDay || ''}
                    onChange={(e) => updateCategoryField('pricePerDay', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Minimum Rental Duration</Label>
                <Select value={categoryFields.minRentalDuration || ''} onValueChange={(value) => updateCategoryField('minRentalDuration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select minimum duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">1 Week</SelectItem>
                    <SelectItem value="30">1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Pickup Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Airport, Downtown, Hotel"
                    className="pl-10"
                    value={categoryFields.pickupLocation || ''}
                    onChange={(e) => updateCategoryField('pickupLocation', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Drop-off Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., Same as pickup, Different location"
                    className="pl-10"
                    value={categoryFields.dropoffLocation || ''}
                    onChange={(e) => updateCategoryField('dropoffLocation', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Driver Included?</Label>
                <Select value={categoryFields.driverIncluded || ''} onValueChange={(value) => updateCategoryField('driverIncluded', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, Driver Included</SelectItem>
                    <SelectItem value="no">No, Self-drive</SelectItem>
                    <SelectItem value="optional">Optional Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Fuel Policy</Label>
                <Select value={categoryFields.fuelPolicy || ''} onValueChange={(value) => updateCategoryField('fuelPolicy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-to-full">Full to Full</SelectItem>
                    <SelectItem value="empty-to-empty">Empty to Empty</SelectItem>
                    <SelectItem value="prepaid">Prepaid Fuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Insurance Included?</Label>
                <Select value={categoryFields.insuranceIncluded || ''} onValueChange={(value) => updateCategoryField('insuranceIncluded', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, Full Coverage</SelectItem>
                    <SelectItem value="basic">Basic Coverage</SelectItem>
                    <SelectItem value="no">No, Additional Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">License Required</Label>
                <Select value={categoryFields.licenseRequired || ''} onValueChange={(value) => updateCategoryField('licenseRequired', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international">International License</SelectItem>
                    <SelectItem value="local">Local License</SelectItem>
                    <SelectItem value="both">Both Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Security Deposit Required (USD)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    value={categoryFields.securityDeposit || ''}
                    onChange={(e) => updateCategoryField('securityDeposit', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium">Number of Vehicles Available</Label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Total vehicles"
                    className="pl-10"
                    value={categoryFields.totalVehicles || ''}
                    onChange={(e) => updateCategoryField('totalVehicles', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 shadow-lg">
                <Plus className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                Create New Listing
              </h1>
              <p className="text-muted-foreground text-lg">
                Share your service with the UniTick community
              </p>
            </div>
          </div>

              <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                <div>
                    <CardTitle className="text-xl">Basic Information</CardTitle>
                    <CardDescription>Essential details about your listing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="serviceType" className="text-sm font-medium">
                    Service Category <span className="text-destructive">*</span>
                  </Label>
                  {allowedCategories.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Grid3x3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={serviceType} onValueChange={(value) => setServiceType(value as ServiceType)}>
                          <SelectTrigger id="serviceType" className="pl-10">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {SERVICE_TYPES[category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        You can only create listings in your selected categories
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading categories...</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Listing Title <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Luxury Downtown Apartment" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your service, what makes it special, and what customers can expect..."
                    className="min-h-[120px] resize-y"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length} characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                <div>
                        <CardTitle className="text-xl">Images</CardTitle>
                        <CardDescription>Add photos to showcase your service</CardDescription>
                      </div>
                      {images.length > 0 && (
                        <Badge variant="secondary">{images.length} uploaded</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <label
                      htmlFor="images"
                    className={`flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-accent/50 transition-all duration-200 ${
                      images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    >
                      {images.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-base font-medium mb-1">
                            {uploadingImages ? "Uploading..." : "Click to upload images"}
                          </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG up to 1MB each • Max 5 images
                        </p>
                        </div>
                      ) : (
                      <div className="w-full p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {images.map((url, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img
                                  src={url || "/placeholder.svg"}
                                  alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border-2 border-border"
                                />
                                <button
                                  type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleRemoveImage(index)
                                }}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              {index === 0 && (
                                <Badge className="absolute bottom-2 left-2 text-xs">
                                  Cover
                                </Badge>
                              )}
                              </div>
                            ))}
                          {images.length < 5 && (
                            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary hover:bg-accent/50 transition-colors">
                              <Plus className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-sm text-muted-foreground">
                            {images.length}/5 images uploaded
                          </p>
                          </div>
                        </div>
                      )}
                      <input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      disabled={uploadingImages || images.length >= 5}
                      />
                    </label>
                  <p className="text-xs text-muted-foreground text-center">
                    First image will be used as the cover photo • Maximum 5 images, 1MB each
                  </p>
                  </div>
              </CardContent>
            </Card>

            {/* Location & Pricing */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                <div>
                    <CardTitle className="text-xl">Location & Pricing</CardTitle>
                    <CardDescription>Where and how much</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="location" 
                      placeholder="e.g., Downtown, Kampala, Uganda"
                      className="pl-10"
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mapUrl" className="text-sm font-medium">
                    Google Maps Link (Optional)
                  </Label>
                  <Input
                    id="mapUrl"
                    placeholder="https://maps.google.com/..."
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Help customers find you easily
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Price (USD) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                    min={0}
                        placeholder="0.00"
                        className="pl-10"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="capacity" className="text-sm font-medium">
                      Max Capacity <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                        placeholder="Maximum people"
                        className="pl-10"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      required
                      min={1}
                    />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="totalTickets" className="text-sm font-medium">
                    Total Tickets Available <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    placeholder="How many tickets for this listing"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(e.target.value)}
                    required
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                <div>
                    <CardTitle className="text-xl">Availability</CardTitle>
                    <CardDescription>When is your service available</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Available Dates
                  </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        type="button" 
                        className="w-full justify-start h-auto py-3"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {availableDates.length === 0
                          ? "Select available dates"
                          : `${availableDates.length} date${availableDates.length > 1 ? "s" : ""} selected`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <div className="p-3">
                              <Calendar
                                mode="multiple"
                          selected={availableDates.map((d) => new Date(d))}
                                onSelect={(dates) => {
                                  const next = (dates || [])
                                    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                                    .map((d) => d.toISOString().split("T")[0])
                                  setAvailableDates(next.sort())
                                }}
                                disabled={{ before: new Date(new Date().toDateString()) }}
                              />
                        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                                <Button
                                  type="button"
                                  variant="ghost"
                            size="sm"
                                  onClick={() => setAvailableDates([])}
                                >
                            Clear All
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                  
                  {availableDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-accent/50 rounded-lg border">
                      {availableDates.map((date) => (
                        <Badge 
                          key={date} 
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 text-sm gap-2"
                        >
                          <span>{new Date(date).toLocaleDateString()}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDate(date)} 
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time Slots */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Slots
                  </Label>
                  <div className="grid sm:grid-cols-3 gap-3 p-4 bg-accent/50 rounded-lg border">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Time</Label>
                      <Input 
                        type="time" 
                        value={newStartTime} 
                        onChange={(e) => setNewStartTime(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          min={1}
                          step={1}
                          placeholder="60"
                          value={newDuration}
                          onChange={(e) => setNewDuration(e.target.value)}
                        />
                        <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as typeof durationUnit)}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutes">mins</SelectItem>
                            <SelectItem value="hours">hrs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        onClick={handleAddTime} 
                        variant="outline" 
                        className="w-full"
                        disabled={!newStartTime}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Slot
                      </Button>
                    </div>
                  </div>
                  
                  {availableTimes.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-accent/50 rounded-lg border">
                      {availableTimes.map((time) => (
                        <Badge 
                          key={time} 
                          variant="secondary"
                          className="pl-3 pr-2 py-1.5 text-sm gap-2"
                        >
                          <Clock className="h-3 w-3" />
                          <span>
                            {time.split("|")[0]} · {Math.floor(parseInt(time.split("|")[1] || "60", 10) / 60)}h
                            {parseInt(time.split("|")[1] || "60", 10) % 60 !== 0 ? ` ${parseInt(time.split("|")[1] || "60", 10) % 60}m` : ""}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveTime(time)} 
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add time slots when your service is available
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Category-Specific Form */}
            {renderCategorySpecificForm()}

            {/* Additional Settings */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                <div>
                    <CardTitle className="text-xl">Additional Settings</CardTitle>
                    <CardDescription>Policies and extras</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="cancellationDays" className="text-sm font-medium">
                    Cancellation Policy
                  </Label>
                  <Select value={cancellationDays} onValueChange={setCancellationDays}>
                    <SelectTrigger id="cancellationDays">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No cancellation allowed</SelectItem>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">7 days before</SelectItem>
                      <SelectItem value="14">14 days before</SelectItem>
                      <SelectItem value="15">15 days before</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    When can customers cancel and get a refund?
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amenities" className="text-sm font-medium">
                    Amenities & Features (Optional)
                  </Label>
                  <Input
                    id="amenities"
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    placeholder="WiFi, Parking, Pool, Air Conditioning"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate with commas
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
                </Button>
              <Button
                type="submit"
                className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading || uploadingImages}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Listing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Create Listing
                  </span>
                )}
              </Button>
            </div>
              </form>

          {/* Footer Info */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Earn 20 Unila Miles when you create your first listing!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
