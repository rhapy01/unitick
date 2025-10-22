"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { MapPin, CheckCircle2, Star, Heart, ThumbsDown, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/wallet"

export default function VendorListingsPage() {
  const [vendor, setVendor] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [replies, setReplies] = useState<Record<string, any[]>>({})
  const [userReview, setUserReview] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [hasDisliked, setHasDisliked] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: vendorData } = await supabase.from("vendors").select("*").eq("id", params.id).single()

      if (!vendorData) {
        router.push("/vendors")
        return
      }

      setVendor(vendorData)
      // Load user's dislike state
      if (user) {
        const { data: dislike } = await supabase
          .from("vendor_dislikes")
          .select("id")
          .eq("vendor_id", params.id)
          .eq("user_id", user.id)
          .maybeSingle()
        setHasDisliked(Boolean(dislike))
      }

      const { data: listingsData } = await supabase
        .from("listings")
        .select("*")
        .eq("vendor_id", params.id)
        .eq("is_active", true)

      setListings(listingsData || [])

      const { data: reviewsData } = await supabase
        .from("vendor_reviews")
        .select("*, user:profiles(full_name)")
        .eq("vendor_id", params.id)
        .order("created_at", { ascending: false })

      setReviews(reviewsData || [])

      // Load replies for all reviews
      const reviewIds = (reviewsData || []).map((r: any) => r.id)
      if (reviewIds.length > 0) {
        const { data: repliesData } = await supabase
          .from("vendor_review_replies")
          .select("*, user:profiles(full_name)")
          .in("review_id", reviewIds)
          .order("created_at", { ascending: true })

        const grouped: Record<string, any[]> = {}
        ;(repliesData || []).forEach((rep: any) => {
          grouped[rep.review_id] = grouped[rep.review_id] || []
          grouped[rep.review_id].push(rep)
        })
        setReplies(grouped)
      }

      if (user) {
        const { data: userReviewData } = await supabase
          .from("vendor_reviews")
          .select("*")
          .eq("vendor_id", params.id)
          .eq("user_id", user.id)
          .single()

        if (userReviewData) {
          setUserReview(userReviewData)
          setRating(userReviewData.rating)
          setComment(userReviewData.comment || "")
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [params.id, router, supabase])

  const handleSubmitReview = async () => {
    if (!userId) {
      toast({
        title: "Login required",
        description: "Please login to leave a review",
        variant: "destructive",
      })
      return
    }

    if (userReview) {
      const { error } = await supabase.from("vendor_reviews").update({ rating, comment }).eq("id", userReview.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update review",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Review updated successfully",
      })
    } else {
      const { error } = await supabase.from("vendor_reviews").insert({
        vendor_id: params.id,
        user_id: userId,
        rating,
        comment,
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to submit review",
          variant: "destructive",
        })
        return
      }

      // Create in-app notification for vendor
      try {
        const { createNotificationFromTemplate } = await import('@/lib/notifications')

        await createNotificationFromTemplate(
          vendor.user_id, // Vendor's user ID
          'new_review',
          {
            reviewerName: userProfile?.full_name || 'Anonymous',
            rating: rating,
            comment: comment?.slice(0, 100) || 'No comment',
            vendorId: params.id,
            vendorName: vendor.business_name
          },
          false // Don't send email, just in-app notification
        )
      } catch (notificationError) {
        console.error('Error creating review notification:', notificationError)
        // Don't fail the review submission if notification fails
      }

      toast({
        title: "Success",
        description: "Review submitted successfully",
      })
    }

    window.location.reload()
  }
  const toggleDislike = async () => {
    if (!userId) {
      toast({ title: "Login required", description: "Please login to give a thumbs down", variant: "destructive" })
      return
    }
    if (!vendor) return
    if (hasDisliked) {
      // Remove dislike
      const { error } = await supabase
        .from("vendor_dislikes")
        .delete()
        .eq("vendor_id", vendor.id)
        .eq("user_id", userId)
      if (!error) {
        setHasDisliked(false)
        setVendor({ ...vendor, dislike_count: Math.max(0, (vendor.dislike_count || 0) - 1) })
      }
      return
    }
    // Add dislike
    const { error } = await supabase.from("vendor_dislikes").insert({ vendor_id: vendor.id, user_id: userId })
    if (!error) {
      setHasDisliked(true)
      setVendor({ ...vendor, dislike_count: (vendor.dislike_count || 0) + 1 })

      // Create in-app notification for vendor
      try {
        const { createNotificationFromTemplate } = await import('@/lib/notifications')

        await createNotificationFromTemplate(
          vendor.user_id, // Vendor's user ID
          'new_dislike',
          {
            vendorId: params.id,
            vendorName: vendor.business_name
          },
          false // Don't send email for dislikes, just in-app
        )
      } catch (notificationError) {
        console.error('Error creating dislike notification:', notificationError)
        // Don't fail the dislike if notification fails
      }
    }
  }
  const toSentenceCase = (value?: string | null) => {
    if (!value) return null
    const s = String(value)
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  }

  const isCurrentUserVendorOwner = () => {
    return Boolean(userId && vendor && vendor.user_id === userId)
  }

  const handleReplyChange = (reviewId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: value }))
  }

  const handleSubmitReply = async (reviewId: string) => {
    if (!isCurrentUserVendorOwner()) {
      toast({ title: "Unauthorized", description: "Only the vendor can reply to feedback", variant: "destructive" })
      return
    }
    const text = (replyDrafts[reviewId] || "").trim()
    if (!text) return
    const { error } = await supabase.from("vendor_review_replies").insert({
      vendor_id: vendor.id,
      review_id: reviewId,
      user_id: userId,
      reply: text,
    })
    if (error) {
      toast({ title: "Error", description: "Failed to post reply", variant: "destructive" })
      return
    }
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }))
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-card rounded" />
            <div className="h-64 bg-card rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Vendor not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 overflow-hidden">
          {/* Banner */}
          {vendor.banner_url && (
            <img src={vendor.banner_url || "/placeholder.svg"} alt="Banner" className="w-full h-40 object-cover" />
          )}
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {vendor.logo_url ? (
                  <img
                    src={vendor.logo_url || "/placeholder.svg"}
                    alt={vendor.company_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground">{vendor.company_name?.charAt(0)}</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h1 className="text-3xl font-bold">{toSentenceCase(vendor.company_name || vendor.business_name) || "NULL"}</h1>
                      {vendor.is_verified ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">No</Badge>
                      )}
                      {vendor.jurisdiction ? (
                        <Badge variant="outline" className="text-xs px-2 py-1 border-accent/30 text-accent">
                          <Globe className="w-3 h-3 mr-1" />
                          {vendor.jurisdiction.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                          Jurisdiction: NIL
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-4 w-4" />
                      {vendor.physical_address || "NULL"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">Reg: {vendor.business_registration_number || "NULL"}</p>
                    <p className="text-sm text-muted-foreground">
                      Wallet: {vendor.wallet_address ? formatAddress(vendor.wallet_address) : "NULL"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    {vendor.rating_count > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400 gradient:fill-yellow-400 gradient:text-yellow-400" />
                          <span className="text-2xl font-bold">
                            {vendor.average_rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{vendor.rating_count} reviews</p>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-5 w-5" />
                        <span className="text-2xl font-bold">{vendor.like_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">likes</p>
                    </div>
                    <div className="text-center">
                      <button onClick={toggleDislike} className="flex items-center gap-1 mb-1">
                        <ThumbsDown className={`h-5 w-5 ${hasDisliked ? "text-red-500 dark:text-red-400 gradient:text-red-400" : "text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground"}`} />
                        <span className="text-2xl font-bold">{vendor.dislike_count || 0}</span>
                      </button>
                      <p className="text-xs text-muted-foreground">thumbs down</p>
                    </div>
                  </div>
                </div>

                {vendor.description && <p className="text-muted-foreground">{vendor.description}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Listings</h2>
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:border-primary transition-colors">
                    <CardContent className="p-0">
                      {listing.images && listing.images.length > 0 && (
                        <img
                          src={listing.images[0] || "/placeholder.svg"}
                          alt={listing.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{listing.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">${listing.price}</span>
                          <Button size="sm" asChild>
                            <Link href={`/listing/${listing.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No listings available</p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Feedback</h2>

            {userId && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">{userReview ? "Update Your Review" : "Leave a Review"}</h3>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)}>
                        <Star
                          className={`h-6 w-6 ${star <= rating ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400 gradient:fill-yellow-400 gradient:text-yellow-400" : "text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-4"
                  />
                  <Button onClick={handleSubmitReview} className="w-full bg-accent text-white hover:bg-accent/90">
                    {userReview ? "Update Review" : "Submit Review"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{review.user?.full_name || "Anonymous"}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400 gradient:fill-yellow-400 gradient:text-yellow-400" : "text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>

                    {/* Replies */}
                    {(replies[review.id] || []).length > 0 && (
                      <div className="mt-3 pl-4 border-l border-border space-y-2">
                        {(replies[review.id] || []).map((rep) => (
                          <div key={rep.id} className="text-sm">
                            <span className="font-medium">{rep.user?.full_name || "Vendor"}:</span>
                            <span className="text-muted-foreground ml-2">{rep.reply}</span>
                            <div className="text-xs text-muted-foreground">{new Date(rep.created_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vendor reply box */}
                    {isCurrentUserVendorOwner() && (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Reply to this feedback..."
                          value={replyDrafts[review.id] || ""}
                          onChange={(e) => handleReplyChange(review.id, e.target.value)}
                          className="mb-2"
                        />
                        <Button size="sm" onClick={() => handleSubmitReply(review.id)}>Reply</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
