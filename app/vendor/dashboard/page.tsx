"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ListingManagement } from "@/components/listing-management"
import { 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Wallet,
  AlertTriangle,
  Clock,
  Star
} from "lucide-react"

interface VendorStats {
  vendorId: string
  totalBookings: number
  totalRevenue: number
  activeListings: number
  totalMiles: number
  averageRating: number
  totalReviews: number
  totalLikes: number
  walletAddress: string
  isWhitelisted: boolean
  recentBookings: Array<{
    id: string
    listing_title: string
    total_amount: number
    created_at: string
  }>
  topListings: Array<{
    id: string
    title: string
    bookings_count: number
    revenue: number
  }>
  badges: Array<{
    name: string
    badge_icon: string
    badge_color: string
  }>
}

export default function VendorDashboardPage() {
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<string>("none")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchVendorStats = async () => {
      setIsLoading(true)
      try {
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
          .select("id, verification_status, average_rating, review_count, like_count, wallet_address")
          .eq("user_id", user.id)
          .single()

        if (!vendorData) {
          router.push("/vendor/setup")
          return
        }

        const vendorId = vendorData.id
        setVerificationStatus(vendorData.verification_status || "none")

        // Check whitelist status
        let isWhitelisted = false
        if (vendorData.wallet_address) {
          try {
            const response = await fetch('/api/admin/vendor-whitelist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'check', 
                address: vendorData.wallet_address 
              })
            })
            const result = await response.json()
            isWhitelisted = result.success && result.isWhitelisted
          } catch (error) {
            console.error('Error checking whitelist status:', error)
          }
        }

        const { count: totalBookings } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)

        const { data: revenueData } = await supabase
          .from("bookings")
          .select("subtotal")
          .eq("vendor_id", vendorId)
          .eq("status", "confirmed")

        const totalRevenue = revenueData?.reduce((sum, booking) => sum + Number(booking.subtotal), 0) || 0

        const { count: activeListings } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .eq("is_active", true)

        const { data: milesData } = await supabase.from("unila_miles").select("miles").eq("vendor_id", vendorId)

        const totalMiles = milesData?.reduce((sum, record) => sum + record.miles, 0) || 0

        const { data: recentBookingsData } = await supabase
          .from("bookings")
          .select("id, total_amount, created_at, listing:listings(title)")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(5)

        const recentBookings =
          recentBookingsData?.map((booking) => ({
            id: booking.id,
            listing_title: booking.listing?.title || "Unknown",
            total_amount: Number(booking.total_amount),
            created_at: booking.created_at,
          })) || []

        const { data: listingsData } = await supabase.from("listings").select("id, title").eq("vendor_id", vendorId)

        const topListings = await Promise.all(
          (listingsData || []).map(async (listing) => {
            const { count } = await supabase
              .from("bookings")
              .select("*", { count: "exact", head: true })
              .eq("listing_id", listing.id)

            const { data: bookingRevenue } = await supabase
              .from("bookings")
              .select("subtotal")
              .eq("listing_id", listing.id)
              .eq("status", "confirmed")

            const revenue = bookingRevenue?.reduce((sum, b) => sum + Number(b.subtotal), 0) || 0

            return {
              id: listing.id,
              title: listing.title,
              bookings_count: count || 0,
              revenue,
            }
          }),
        )

        topListings.sort((a, b) => b.bookings_count - a.bookings_count)

        const { data: badgesData } = await supabase
          .from("user_badges")
          .select("badge:badges(name, badge_icon, badge_color)")
          .eq("vendor_id", vendorId)

        const badges =
          badgesData?.map((b) => ({
            name: b.badge?.name || "",
            badge_icon: b.badge?.badge_icon || "",
            badge_color: b.badge?.badge_color || "",
          })) || []

        setStats({
          vendorId,
          totalBookings: totalBookings || 0,
          totalRevenue,
          activeListings: activeListings || 0,
          totalMiles,
          averageRating: vendorData.average_rating || 0,
          totalReviews: vendorData.review_count || 0,
          totalLikes: vendorData.like_count || 0,
          walletAddress: vendorData.wallet_address || '',
          isWhitelisted,
          recentBookings,
          topListings: topListings.slice(0, 5),
          badges,
        })
      } catch (error) {
        console.error("[v0] Error fetching vendor stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorStats()
  }, [router, supabase])

  const handleApplyForVerification = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendor, error: vendorError } = await supabase.from("vendors").select("id").eq("user_id", user.id).single()

      if (vendorError) {
        console.error("Error fetching vendor:", vendorError)
        return
      }

      if (!vendor) return

      const { error } = await supabase
        .from("vendors")
        .update({
          verification_status: "pending",
          verification_applied_at: new Date().toISOString(),
        })
        .eq("id", vendor.id)

      if (error) throw error

      setVerificationStatus("pending")
      alert("Verification application submitted successfully!")
    } catch (error) {
      console.error("[v0] Error applying for verification:", error)
      alert("Failed to submit verification application")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-card rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-card rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Manage your listings and track performance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Whitelist Status */}
            {stats && (
              <>
                {stats.isWhitelisted ? (
                  <Badge variant="default" className="px-4 py-2 bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Wallet Whitelisted
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="px-4 py-2">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Wallet Not Whitelisted
                  </Badge>
                )}
              </>
            )}
            
            {/* Verification Status */}
            {verificationStatus === "none" && (
              <Button variant="outline" onClick={handleApplyForVerification}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Apply for Verification
              </Button>
            )}
            {verificationStatus === "pending" && (
              <Badge variant="secondary" className="px-4 py-2">
                <Clock className="mr-2 h-4 w-4" />
                Verification Pending
              </Badge>
            )}
            {verificationStatus === "approved" && (
              <Badge variant="default" className="px-4 py-2">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verified
              </Badge>
            )}
            <Button asChild>
              <Link href="/vendor/listings/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeListings || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unila Miles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMiles || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Keep earning to unlock badges!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageRating ? stats.averageRating.toFixed(1) : "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.totalReviews || 0} reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLikes || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Total reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Whitelist Status Card */}
        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Wallet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stats.isWhitelisted ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-medium">
                        {stats.isWhitelisted ? 'Wallet Whitelisted' : 'Wallet Not Whitelisted'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stats.walletAddress ? `${stats.walletAddress.slice(0, 6)}...${stats.walletAddress.slice(-4)}` : 'No wallet address'}
                      </p>
                    </div>
                  </div>
                  {stats.isWhitelisted ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Ready to Receive Payments
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Cannot Receive Payments
                    </Badge>
                  )}
                </div>
                
                {!stats.isWhitelisted && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            Action Required: Wallet Whitelist
                          </p>
                          <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1 mt-2">
                            <p>• Your wallet address must be whitelisted before you can receive payments</p>
                            <p>• Only whitelisted addresses can receive funds through our smart contract</p>
                            <p>• Complete the whitelist application form to get approved</p>
                            <p>• You'll receive an email notification once whitelisted</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                            <a 
                              href="https://formspree.io/f/xrgnzlog" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1"
                            >
                              <Wallet className="h-3 w-3" />
                              Apply for Whitelist
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a 
                              href="/vendor/setup" 
                              className="inline-flex items-center gap-1"
                            >
                              Update Profile
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listing Management Section */}
        {stats && (
          <div className="mt-8">
            <ListingManagement vendorId={stats.vendorId} />
          </div>
        )}

        {stats && stats.badges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {stats.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                    style={{ borderColor: badge.badge_color }}
                  >
                    <span className="text-2xl">{badge.badge_icon}</span>
                    <span className="font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {stats && stats.recentBookings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <p className="font-medium">{booking.listing_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">${booking.total_amount.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">No bookings yet</p>
              </CardContent>
            </Card>
          )}

          {stats && stats.topListings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topListings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">{listing.bookings_count} bookings</p>
                      </div>
                      <Badge variant="secondary">${listing.revenue.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">No listings yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
