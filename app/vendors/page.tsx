"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, CheckCircle2, Star, Heart, Search, Sparkles, ArrowRight, Building2, Globe, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sanitizeUserInput } from "@/lib/sanitize"

interface VendorWithStats {
  id: string
  user_id: string
  company_name: string
  business_name: string
  physical_address: string
  business_registration_number: string
  logo_url: string | null
  banner_url: string | null
  description: string | null
  is_verified: boolean
  jurisdiction: string | null
  average_rating: number
  rating_count: number
  comment_count: number
  like_count: number
  dislike_count: number
  user_has_liked: boolean
  user_has_disliked: boolean
}

export default function BrowseVendorsPage() {
  const [vendors, setVendors] = useState<VendorWithStats[]>([])
  const [filteredVendors, setFilteredVendors] = useState<VendorWithStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedVendorForReview, setSelectedVendorForReview] = useState<VendorWithStats | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const res = await fetch("/api/vendors", { cache: "no-store" })
      const vendorsData = res.ok ? await res.json() : []

      if (!vendorsData) {
        setIsLoading(false)
        return
      }

      const vendorsWithStats = await Promise.all(
        vendorsData.map(async (vendor: any) => {
          let userHasLiked = false
          if (user) {
            const { data: likeData } = await supabase
              .from("vendor_likes")
              .select("id")
              .eq("vendor_id", vendor.id)
              .eq("user_id", user.id)
              .single()

            userHasLiked = !!likeData
          }

          return {
            ...vendor,
            user_has_liked: userHasLiked,
          }
        }),
      )

      setVendors(vendorsWithStats)
      setFilteredVendors(vendorsWithStats)
      setIsLoading(false)
    }

    fetchVendors()
  }, [supabase])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVendors(vendors)
    } else {
      const filtered = vendors.filter(
        (vendor) =>
          vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.physical_address?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredVendors(filtered)
    }
  }, [searchQuery, vendors])

  const handleToggleLike = async (vendorId: string) => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to like service providers",
        variant: "destructive",
      })
      return
    }

    const vendor = vendors.find((v) => v.id === vendorId)
    if (!vendor) return

    if (vendor.user_has_liked) {
      // Likes are irreversible - once liked, can't unlike
      toast({
        title: "Action completed",
        description: "You have already liked this vendor",
      })
      return
    }

    const { error } = await supabase.from("vendor_likes").insert({ vendor_id: vendorId, user_id: userId })

    if (error) {
      console.error("Error adding like:", error)
      return
    }

    // Create in-app notification for vendor
    try {
      if (!vendor.user_id) {
        console.error('Vendor user_id is undefined for vendor:', vendor.id)
        return
      }

      const { createNotificationFromTemplate } = await import('@/lib/notifications')

      await createNotificationFromTemplate(
        vendor.user_id, // Vendor's user ID
        'new_like',
        {
          vendorId: vendorId,
          vendorName: vendor.business_name
        },
        false // Don't send email for likes, just in-app
      )
    } catch (notificationError) {
      console.error('Error creating like notification:', notificationError)
      // Don't fail the like if notification fails
    }

    setVendors(
      vendors.map((v) => (v.id === vendorId ? { ...v, user_has_liked: true, like_count: v.like_count + 1 } : v)),
    )
  }

  const handleToggleDislike = async (vendorId: string) => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to dislike service providers",
        variant: "destructive",
      })
      return
    }

    const vendor = vendors.find((v) => v.id === vendorId)
    if (!vendor) return

    if (vendor.user_has_disliked) {
      // Dislikes are irreversible - once disliked, can't undislike
      toast({
        title: "Action completed",
        description: "You have already disliked this vendor",
      })
      return
    }

    const { error } = await supabase.from("vendor_dislikes").insert({ vendor_id: vendorId, user_id: userId })

    if (error) {
      console.error("Error adding dislike:", error)
      return
    }

    // Create in-app notification for vendor
    try {
      if (!vendor.user_id) {
        console.error('Vendor user_id is undefined for vendor:', vendor.id)
        return
      }

      const { createNotificationFromTemplate } = await import('@/lib/notifications')

      await createNotificationFromTemplate(
        vendor.user_id, // Vendor's user ID
        'new_dislike',
        {
          vendorId: vendorId,
          vendorName: vendor.business_name
        },
        false // Don't send email for dislikes, just in-app
      )
    } catch (notificationError) {
      console.error('Error creating dislike notification:', notificationError)
      // Don't fail the dislike if notification fails
    }

    setVendors(
      vendors.map((v) => (v.id === vendorId ? { ...v, user_has_disliked: true, dislike_count: (vendor.dislike_count || 0) + 1 } : v)),
    )
  }

  const handleOpenReviewModal = (vendor: VendorWithStats) => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to leave a review",
        variant: "destructive",
      })
      return
    }
    setSelectedVendorForReview(vendor)
    setReviewRating(0) // Reset rating when opening modal
    setHoveredRating(0) // Reset hover state
    setReviewComment("") // Reset comment
    setReviewModalOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!userId || !selectedVendorForReview) return

    // Allow either rating OR comment, or both
    if ((reviewRating < 1 || reviewRating > 5) && (!reviewComment.trim())) {
      toast({
        title: "Input required",
        description: "Please provide either a rating or a comment",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReview(true)

    try {
      // Submit the review (users can have multiple reviews now)
      const { error } = await supabase.from("vendor_reviews").insert({
        vendor_id: selectedVendorForReview.id,
        user_id: userId,
        rating: reviewRating > 0 ? reviewRating : null, // Only save rating if selected
        comment: reviewComment.trim() || null,
      })

      if (error) {
        console.error("Error submitting review:", error)
        toast({
          title: "Error",
          description: "Failed to submit review",
          variant: "destructive",
        })
        return
      }

      // Create in-app notification for vendor
      try {
        if (!selectedVendorForReview.user_id) {
          console.error('Vendor user_id is undefined for vendor:', selectedVendorForReview.id)
          return
        }

        const { createNotificationFromTemplate } = await import('@/lib/notifications')
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single()

        await createNotificationFromTemplate(
          selectedVendorForReview.user_id, // Vendor's user ID
          'new_review',
          {
            reviewerName: userProfile?.full_name || 'Anonymous',
            rating: reviewRating,
            comment: reviewComment?.slice(0, 100) || 'No comment',
            vendorId: selectedVendorForReview.id,
            vendorName: selectedVendorForReview.business_name
          },
          false // Don't send email, just in-app notification
        )
      } catch (notificationError) {
        console.error('Error creating review notification:', notificationError)
        // Don't fail the review submission if notification fails
      }

      // Update local state
      setVendors(vendors.map(vendor =>
        vendor.id === selectedVendorForReview.id
          ? {
              ...vendor,
              rating_count: (vendor.rating_count || 0) + 1,
              average_rating: ((vendor.average_rating || 0) * (vendor.rating_count || 0) + reviewRating) / ((vendor.rating_count || 0) + 1)
            }
          : vendor
      ))

      toast({
        title: "Success",
        description: "Review submitted successfully",
      })

      // Reset form
      setReviewModalOpen(false)
      setSelectedVendorForReview(null)
      setReviewRating(5)
      setReviewComment("")

    } catch (error) {
      console.error("Review submission error:", error)
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const verifiedVendors = filteredVendors.filter(v => v.is_verified)
  const unverifiedVendors = filteredVendors.filter(v => !v.is_verified)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="px-3 py-1.5" style={{backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6'}}>
              Service Providers
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Discover <span className="text-accent">Trusted Providers</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse verified service providers and discover their offerings. All providers are rated and reviewed by our community.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, location, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Stats Card */}
        {!isLoading && (
          <div className="mb-10">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold mb-1">{vendors.length}</div>
                    <div className="text-sm text-muted-foreground">Total Providers</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold mb-1 text-primary">{verifiedVendors.length}</div>
                    <div className="text-sm text-muted-foreground">Verified</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold mb-1">{filteredVendors.length}</div>
                    <div className="text-sm text-muted-foreground">Showing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-72 animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-12 bg-muted rounded mb-4" />
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="space-y-10">
            {/* Verified Providers Section */}
            {verifiedVendors.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold">Verified Providers</h2>
                  </div>
                  <Badge className="px-3 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {verifiedVendors.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {verifiedVendors.map((vendor) => (
                    <Card key={vendor.id} className="hover:shadow-lg hover:border-primary/50 transition-all border-2 overflow-hidden">
                      {/* Banner Image (Twitter/X style) */}
                      <div className="w-full h-32 bg-gradient-to-r from-primary/10 to-primary/20">
                        {vendor.banner_url ? (
                          <img
                            src={vendor.banner_url}
                            alt={`${vendor.company_name || vendor.business_name} banner`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10" />
                        )}
                      </div>

                <CardContent className="p-6 -mt-10">
                        {/* Logo and Company Name (overlapping banner like Twitter) */}
                  <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-lg bg-card flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-card shadow-lg">
                      {vendor.logo_url ? (
                        <img
                                src={vendor.logo_url}
                                alt={vendor.company_name || vendor.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                              <span className="text-2xl font-bold text-primary">
                                {(vendor.company_name || vendor.business_name)?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg capitalize">
                                {sanitizeUserInput(vendor.company_name || vendor.business_name)?.toLowerCase()}
                              </h3>
                              {vendor.jurisdiction ? (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-accent/30 text-accent">
                                  <Globe className="w-3 h-3 mr-1" />
                                  {vendor.jurisdiction.toUpperCase()}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                  NIL
                                </Badge>
                              )}
                            </div>
                            
                            {/* Verification Status */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                Verification:
                              </Badge>
                              {vendor.is_verified ? (
                            <CheckCircle2 className="h-5 w-5 text-[#ff00ff] fill-[#ff00ff] drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]" />
                              ) : (
                                <span className="text-sm text-muted-foreground">NO</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Company Details */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-primary/10">
                          <div className="text-sm">
                            <span className="font-medium text-primary">Registration Number: </span>
                            <span className="text-muted-foreground">
                              {sanitizeUserInput(vendor.business_registration_number) || "NIL"}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium text-primary">Physical Address: </span>
                            <span className="text-muted-foreground">
                              {sanitizeUserInput(vendor.physical_address) || "NIL"}
                            </span>
                      </div>
                          
                          <div className="text-sm">
                            <span className="font-medium text-primary">Description: </span>
                            <span className="text-muted-foreground line-clamp-2">
                              {sanitizeUserInput(vendor.description) || "NIL"}
                            </span>
                    </div>
                  </div>

                        {/* Rating and Interaction Buttons */}
                        <div className="flex items-center gap-3 mb-4">
                          {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-medium">
                                {vendor.average_rating > 0 ? vendor.average_rating.toFixed(1) : "0.0"}
                              </span>
                              <span className="text-xs text-muted-foreground">({vendor.rating_count})</span>
                      </div>
                          
                          {/* Like Button */}
                      <button
                        onClick={() => handleToggleLike(vendor.id)}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        <Heart className={`h-4 w-4 ${vendor.user_has_liked ? "fill-red-500 text-red-500" : ""}`} />
                        <span className="text-sm">{vendor.like_count}</span>
                      </button>
                          
                          {/* Thumb Down Button */}
                          <button
                            onClick={() => handleToggleDislike(vendor.id)}
                            className={`flex items-center gap-1 transition-colors px-2 py-1 rounded ${
                              vendor.user_has_disliked
                                ? "text-orange-500 bg-orange-500/10"
                                : "hover:text-orange-500 hover:bg-orange-500/10"
                            }`}
                            disabled={vendor.user_has_disliked} // Make it irreversible
                          >
                            <svg className={`h-4 w-4 ${vendor.user_has_disliked ? "fill-orange-500" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            <span className="text-sm">{vendor.dislike_count}</span>
                          </button>
                          
                          {/* Review Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8"
                            onClick={() => handleOpenReviewModal(vendor)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Review
                          </Button>

                        </div>

                        {/* All Services Button */}
                        <Button size="sm" className="w-full" asChild>
                          <Link href={`/vendor/${vendor.id}/listings`}>
                            All Services
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other Providers Section */}
            {unverifiedVendors.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold">All Providers</h2>
                  <Badge variant="secondary" className="px-3 py-1">
                    {unverifiedVendors.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unverifiedVendors.map((vendor) => (
                    <Card key={vendor.id} className="hover:shadow-lg hover:border-primary/30 transition-all border-2 overflow-hidden">
                      {/* Banner Image (Twitter/X style) */}
                      <div className="w-full h-32 bg-muted">
                        {vendor.banner_url ? (
                          <img
                            src={vendor.banner_url}
                            alt={`${vendor.company_name || vendor.business_name} banner`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted" />
                        )}
                      </div>

                      <CardContent className="p-6 -mt-10">
                        {/* Logo and Company Name (overlapping banner like Twitter) */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-lg bg-card flex items-center justify-center flex-shrink-0 overflow-hidden border-4 border-card shadow-lg">
                            {vendor.logo_url ? (
                              <img
                                src={vendor.logo_url}
                                alt={vendor.company_name || vendor.business_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-primary/50">
                                {(vendor.company_name || vendor.business_name)?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg capitalize">
                                {sanitizeUserInput(vendor.company_name || vendor.business_name)?.toLowerCase()}
                              </h3>
                              {vendor.jurisdiction ? (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-accent/30 text-accent">
                                  <Globe className="w-3 h-3 mr-1" />
                                  {vendor.jurisdiction.toUpperCase()}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                  NIL
                                </Badge>
                              )}
                            </div>
                            
                            {/* Verification Status */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                Verification:
                              </Badge>
                              {vendor.is_verified ? (
                                <CheckCircle2 className="h-5 w-5 text-[#ff00ff] fill-[#ff00ff] drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]" />
                              ) : (
                                <span className="text-sm text-muted-foreground">NO</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Company Details */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-primary/10">
                          <div className="text-sm">
                            <span className="font-medium text-primary">Registration Number: </span>
                            <span className="text-muted-foreground">
                              {sanitizeUserInput(vendor.business_registration_number) || "NIL"}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium text-primary">Physical Address: </span>
                            <span className="text-muted-foreground">
                              {sanitizeUserInput(vendor.physical_address) || "NIL"}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium text-primary">Description: </span>
                            <span className="text-muted-foreground line-clamp-2">
                              {sanitizeUserInput(vendor.description) || "NIL"}
                            </span>
                    </div>
                  </div>

                        {/* Rating and Interaction Buttons */}
                        <div className="flex items-center gap-3 mb-4">
                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {vendor.average_rating > 0 ? vendor.average_rating.toFixed(1) : "0.0"}
                            </span>
                            <span className="text-xs text-muted-foreground">({vendor.rating_count})</span>
                          </div>
                          
                          {/* Comments */}
                          {vendor.comment_count > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{vendor.comment_count} reviews</span>
                            </div>
                          )}
                          
                          {/* Like Button */}
                          <button
                            onClick={() => handleToggleLike(vendor.id)}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                          >
                            <Heart className={`h-4 w-4 ${vendor.user_has_liked ? "fill-red-500 text-red-500" : ""}`} />
                            <span className="text-sm">{vendor.like_count}</span>
                          </button>
                          
                          {/* Thumb Down Button */}
                          <button
                            onClick={() => handleToggleDislike(vendor.id)}
                            className={`flex items-center gap-1 transition-colors px-2 py-1 rounded ${
                              vendor.user_has_disliked
                                ? "text-orange-500 bg-orange-500/10"
                                : "hover:text-orange-500 hover:bg-orange-500/10"
                            }`}
                            disabled={vendor.user_has_disliked} // Make it irreversible
                          >
                            <svg className={`h-4 w-4 ${vendor.user_has_disliked ? "fill-orange-500" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            <span className="text-sm">{vendor.dislike_count}</span>
                          </button>
                          
                  </div>

                        {/* All Services Button */}
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <Link href={`/vendor/${vendor.id}/listings`}>
                            All Services
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                </CardContent>
              </Card>
            ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto border-dashed">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any service providers matching "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Modal */}
        <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
              <DialogDescription>
                Share your experience with {selectedVendorForReview?.business_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Rating Stars */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating (Optional)</label>
                <p className="text-xs text-muted-foreground">Click the stars to rate (leave blank if you just want to comment)</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setReviewRating(star)
                        setHoveredRating(0) // Clear hover after selection
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-1"
                      disabled={isSubmittingReview}
                      title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors cursor-pointer ${
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                            : star <= hoveredRating
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                            : "text-white hover:text-yellow-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {hoveredRating > 0
                      ? `${hoveredRating} star${hoveredRating !== 1 ? 's' : ''} - ${
                          hoveredRating === 1 ? "Poor" :
                          hoveredRating === 2 ? "Fair" :
                          hoveredRating === 3 ? "Good" :
                          hoveredRating === 4 ? "Very Good" :
                          "Excellent"
                        }`
                      : reviewRating === 0
                      ? "Click stars to rate this vendor"
                      : `${reviewRating} star${reviewRating !== 1 ? 's' : ''} - ${
                          reviewRating === 1 ? "Poor" :
                          reviewRating === 2 ? "Fair" :
                          reviewRating === 3 ? "Good" :
                          reviewRating === 4 ? "Very Good" :
                          "Excellent"
                        }`
                    }
                  </p>
                  <button
                    type="button"
                    onClick={() => setReviewRating(0)}
                    className="text-xs text-muted-foreground hover:text-red-500 underline"
                    disabled={isSubmittingReview}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Comment (Optional)</label>
                <Textarea
                  placeholder="Share your experience with this vendor..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {reviewComment.length}/500 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewModalOpen(false)
                    setSelectedVendorForReview(null)
                    setReviewRating(5)
                    setReviewComment("")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="flex-1"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Once submitted, reviews cannot be modified or deleted.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
