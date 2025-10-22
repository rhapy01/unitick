"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Vendor, Listing, Booking } from "@/lib/types"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clock, CheckCircle, AlertCircle, CreditCard, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/wallet"
import { UNITICK_ADDRESS } from "@/lib/addresses"
import { unitickAbi } from "@/lib/contract-client"
import { Plus, Package, Calendar, User, Settings, Wallet, Bell, ShoppingCart, ShoppingBag, Coins } from "lucide-react"
import Link from "next/link"
import { WalletManagement } from "@/components/wallet-management"

// Faucet Claim Component
function FaucetClaimComponent({ profile }: { profile: Profile | null }) {
  const { toast } = useToast()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null)
  const [canClaim, setCanClaim] = useState<boolean | null>(null)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)

  useEffect(() => {
    checkClaimStatus()
  }, [profile])

  const checkClaimStatus = async () => {
    if (!profile?.wallet_address) {
      console.log('[Dashboard] No wallet address, skipping faucet check')
      setIsCheckingStatus(false)
      return
    }

    // Validate wallet address format
    if (!profile.wallet_address.startsWith('0x') || profile.wallet_address.length !== 42) {
      console.log('[Dashboard] Invalid wallet address format:', profile.wallet_address)
      setIsCheckingStatus(false)
      return
    }

    try {
      // Check if user can claim using the contract
      const response = await fetch('/api/faucet/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: profile.wallet_address
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setCanClaim(result.canClaim)
        setTimeUntilNextClaim(result.timeUntilNextClaim)
        console.log('[Dashboard] Claim status:', {
          canClaim: result.canClaim,
          timeUntilNextClaim: result.timeUntilNextClaim,
          walletAddress: profile.wallet_address
        })
      } else {
        console.log('[Dashboard] Error checking claim status:', {
          error: result.error,
          details: result.details,
          status: response.status
        })
        // Don't show error toast for faucet check failures, just log silently
        // This is not critical functionality and shouldn't interrupt the user
      }
    } catch (error) {
      console.log('[Dashboard] Network error checking faucet status:', error instanceof Error ? error.message : String(error))
      // Silently fail for faucet checks - it's not critical functionality
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleClaimFaucet = async () => {
    if (!canClaim) return

    if (!password) {
      setShowPasswordInput(true)
      return
    }

    setIsClaiming(true)
    try {
      const response = await fetch('/api/faucet/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password
        })
      })

      const result = await response.json()
      console.log('[Frontend] API Response:', { status: response.status, result })

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to claim faucet tokens')
      }

      console.log('[Frontend] Setting transaction hash:', result.transactionHash)
      try {
        setClaimTxHash(result.transactionHash)
        console.log('[Frontend] Transaction hash set successfully')
      } catch (e) {
        console.error('[Frontend] Error setting transaction hash:', e)
      }
      
      try {
        setCanClaim(false) // User can't claim again immediately
        console.log('[Frontend] Can claim set to false')
      } catch (e) {
        console.error('[Frontend] Error setting can claim:', e)
      }
      
      try {
        setPassword('') // Clear password for security
        console.log('[Frontend] Password cleared')
      } catch (e) {
        console.error('[Frontend] Error clearing password:', e)
      }
      
      try {
        setShowPasswordInput(false) // Hide password input
        console.log('[Frontend] Password input hidden')
      } catch (e) {
        console.error('[Frontend] Error hiding password input:', e)
      }
      
      console.log('[Frontend] Showing success toast')
      try {
        toast({
          title: "Claim Successful",
          description: "200,000 UniTick tokens claimed successfully!",
        })
        console.log('[Frontend] Success toast shown')
      } catch (e) {
        console.error('[Frontend] Error showing success toast:', e)
      }
      console.log('[Frontend] Faucet claim completed successfully')
    } catch (error) {
      console.error('[Frontend] Error caught in faucet claim:', error)
      console.error('[Frontend] Error type:', typeof error)
      console.error('[Frontend] Error constructor:', error?.constructor?.name)
      console.error('[Frontend] Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim faucet tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  const formatTimeRemaining = (seconds: string) => {
    const secondsNum = Number(seconds)
    const hours = Math.floor(secondsNum / 3600)
    const minutes = Math.floor((secondsNum % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (!profile?.wallet_address) {
    return (
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertDescription>
          Please create your wallet first to claim faucet tokens. Use the Wallet Management section above.
        </AlertDescription>
      </Alert>
    )
  }

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Checking claim status...</span>
      </div>
    )
  }

  // If we couldn't check status (API error), show a friendly message
  if (canClaim === null && !isCheckingStatus) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="mb-2">Faucet service is currently unavailable.</p>
          <p className="text-sm text-muted-foreground">
            You can still use the platform to browse and book services. 
            The faucet allows you to get test tokens for free on the Base Sepolia testnet.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={checkClaimStatus}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (canClaim === false && timeUntilNextClaim) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          You can claim again in {formatTimeRemaining(timeUntilNextClaim)}.
          Each address can claim 200,000 UniTick tokens once every 24 hours.
          <br />
          <br />
          <strong>Note:</strong> If you previously used an external wallet (MetaMask, etc.), 
          that was a different address. Your internal wallet address is:{" "}
          <span className="font-mono text-sm">
            {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  if (canClaim) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You can claim 200,000 UniTick tokens! Your wallet is ready.
            <br />
            <br />
            <strong>Note:</strong> This is your internal wallet address:{" "}
            <span className="font-mono text-sm">
              {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
            </span>
            {" "}(different from any external wallet you may have used before)
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-4">
          {!showPasswordInput ? (
            <Button
              onClick={handleClaimFaucet}
              disabled={isClaiming}
              className="flex items-center gap-2"
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Coins className="h-4 w-4" />
              )}
              {isClaiming ? 'Claiming...' : 'Claim UniTick Tokens'}
            </Button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Input
                type="password"
                placeholder="Enter your password to claim tokens"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleClaimFaucet()
                  }
                }}
              />
              <Button
                onClick={handleClaimFaucet}
                disabled={isClaiming || !password}
                className="flex items-center gap-2"
              >
                {isClaiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="h-4 w-4" />
                )}
                {isClaiming ? 'Claiming...' : 'Claim'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordInput(false)
                  setPassword('')
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <div>Wallet: {profile.wallet_address ? formatAddress(profile.wallet_address) : 'Not available'}</div>
            <div>Amount: 200,000 UTICK</div>
          </div>
        </div>

        {claimTxHash && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Claim transaction submitted!{' '}
              <a
                href={`https://sepolia.basescan.org/tx/${claimTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                View on Base Sepolia Explorer
              </a>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Unable to check claim status. Please try refreshing the page.
      </AlertDescription>
    </Alert>
  )
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const formatDate = (value: unknown) => {
    if (!value) return "Not selected"
    const d = new Date(value as string)
    if (isNaN(d.getTime())) return "Not selected"
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingBookingId(bookingId)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to cancel bookings.",
          variant: "destructive",
        })
        return
      }

      // Call the database function to cancel the booking
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_user_id: userData.user.id
      })

      if (error) {
        console.error("Error cancelling booking:", error)
        toast({
          title: "Error",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (data === true) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully.",
        })
        
        // Refresh bookings
        const { data: updatedBookings } = await supabase
          .from("bookings")
          .select("*, listing:listings(*, vendor:vendors(*))")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
        
        // Get order IDs for each booking
        if (updatedBookings && updatedBookings.length > 0) {
          const bookingIds = updatedBookings.map(b => b.id)
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("booking_id, order_id")
            .in("booking_id", bookingIds)

          // Add order_id to each booking
          const bookingsWithOrders = updatedBookings.map(booking => {
            const orderItem = orderItems?.find(oi => oi.booking_id === booking.id)
            return {
              ...booking,
              order_id: orderItem?.order_id
            }
          })
          setBookings(bookingsWithOrders)
        } else {
        setBookings(updatedBookings || [])
        }
      } else {
        toast({
          title: "Error",
          description: "Could not cancel this booking. It may already be confirmed or cancelled.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setCancellingBookingId(null)
    }
  }

  const handleResumePayment = async (booking: Booking) => {
    try {
      // Find the order that contains this booking
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("booking_id", booking.id)
        .single()

      if (orderItemsError || !orderItems) {
        toast({
          title: "Error",
          description: "Could not find the associated order for this booking.",
          variant: "destructive",
        })
        return
      }

      const orderId = orderItems.order_id

      // Get all bookings for this order
      const { data: orderBookings, error: orderBookingsError } = await supabase
        .from("order_items")
        .select(`
          booking_id,
          bookings(
            id,
            quantity,
            booking_date,
            listing:listings(id, title, price, location, vendor_id, vendors(business_name))
          )
        `)
        .eq("order_id", orderId)

      if (orderBookingsError || !orderBookings) {
        toast({
          title: "Error",
          description: "Could not load order details.",
          variant: "destructive",
        })
        return
      }

      // Convert order bookings back to cart item format
      const cartItems = orderBookings.map((item: any) => ({
        _id: item.bookings.id,
        listing: {
          id: item.bookings.listing.id,
          title: item.bookings.listing.title,
          price: item.bookings.listing.price,
          location: item.bookings.listing.location,
          vendor_id: item.bookings.listing.vendor_id,
          vendor: item.bookings.listing.vendors
        },
        quantity: item.bookings.quantity,
        booking_date: item.bookings.booking_date,
        is_gift: false, // Assume not gift for pending payments
        recipient_name: undefined,
        recipient_email: undefined,
        recipient_phone: undefined,
      }))

      // Store selected item IDs in localStorage (all items from the order)
      const selectedIds = cartItems.map(item => item._id)
      localStorage.setItem("selectedCartItems", JSON.stringify(selectedIds))

      // Navigate to payment page
      router.push("/payment")

    } catch (error) {
      console.error("Error resuming payment:", error)
      toast({
        title: "Error",
        description: "Failed to resume payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      console.log("[v0] Dashboard: Starting data fetch...")
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Dashboard: User data:", user?.email || "No user")

      if (!user) {
        console.log("[v0] Dashboard: No user found, redirecting to login...")
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      console.log("[v0] Dashboard: Profile data:", profileData)
      console.log("[v0] Dashboard: User role:", profileData?.role)

      if (profileData) {
        setProfile(profileData)

        if (profileData.role === "admin") {
          console.log("[v0] Dashboard: Admin user, redirecting to admin panel...")
          router.push("/admin")
          return
        }

        if (profileData.role === "vendor") {
          console.log("[v0] Dashboard: Vendor user, fetching vendor data...")
          const { data: vendorData } = await supabase.from("vendors").select("*").eq("user_id", user.id).single()

          if (vendorData) {
            setVendor(vendorData)

            const { data: listingsData } = await supabase.from("listings").select("*").eq("vendor_id", vendorData.id)

            setListings(listingsData || [])

            const { data: bookingsData } = await supabase
              .from("bookings")
              .select("*, listing:listings(*)")
              .eq("vendor_id", vendorData.id)
              .order("created_at", { ascending: false })

            setBookings(bookingsData || [])
          } else {
            console.log("[v0] Dashboard: Vendor profile not found - user needs to complete vendor setup")
            // Don't fetch vendor data, let the user complete setup first
          }
        } else {
          console.log("[v0] Dashboard: Regular user, fetching bookings...")
          // First get bookings
          const { data: userBookingsData } = await supabase
            .from("bookings")
            .select("*, listing:listings(*, vendor:vendors(*))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          // Then get order IDs for each booking
          if (userBookingsData && userBookingsData.length > 0) {
            const bookingIds = userBookingsData.map(b => b.id)
            const { data: orderItems } = await supabase
              .from("order_items")
              .select("booking_id, order_id")
              .in("booking_id", bookingIds)

            // Add order_id to each booking
            const bookingsWithOrders = userBookingsData.map(booking => {
              const orderItem = orderItems?.find(oi => oi.booking_id === booking.id)
              return {
                ...booking,
                order_id: orderItem?.order_id
              }
            })
            setBookings(bookingsWithOrders)
          } else {
          setBookings(userBookingsData || [])
          }
        }
      } else {
        console.log("[v0] Dashboard: Profile not found in database")
      }

      console.log("[v0] Dashboard: Data fetch complete")
      setIsLoading(false)
    }

    fetchData()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-1/4 mb-8" />
            <div className="h-64 bg-card rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Profile not found</p>
        </div>
      </div>
    )
  }

  if (profile.role === "vendor" && !vendor) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Complete Your Vendor Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                You signed up as a vendor but haven't completed your vendor profile yet. 
                Complete the setup to start listing your services.
              </p>
              <Button asChild>
                <Link href="/vendor/setup">Complete Vendor Setup</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (profile.role === "vendor") {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">Vendor Dashboard</h1>
              <p className="text-muted-foreground truncate">{vendor?.business_name}</p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center self-end sm:self-auto justify-end sm:justify-start">
              <Button size="sm" className="sm:order-2" asChild>
                <Link href="/vendor/listings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Listing
                </Link>
              </Button>
              {/* Settings button only visible on desktop */}
              <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                <Link href="/vendor/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-full bg-primary/10 shrink-0">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Listings</p>
                    <p className="text-xl sm:text-2xl font-bold">{listings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-full bg-accent/10 shrink-0">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-xl sm:text-2xl font-bold">{bookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 md:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-full bg-primary/10 shrink-0">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-xl sm:text-2xl font-bold">{listings.filter((l) => l.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="listings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="listings" className="text-xs sm:text-sm">My Listings</TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs sm:text-sm">Bookings</TabsTrigger>
              <TabsTrigger value="verify" className="text-xs sm:text-sm">Verify Tickets</TabsTrigger>
              <TabsTrigger value="wallet" className="text-xs sm:text-sm">Wallet</TabsTrigger>
            </TabsList>

            <TabsContent value="listings">
              <Card>
                <CardHeader>
                  <CardTitle>My Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {listings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You haven&apos;t created any listings yet</p>
                      <Button asChild>
                        <Link href="/vendor/listings/new">Create Your First Listing</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {listings.map((listing) => (
                        <div
                          key={listing.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{listing.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{listing.location}</p>
                            <p className="text-sm font-semibold mt-1">${listing.price}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded whitespace-nowrap ${listing.is_active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}
                            >
                              {listing.is_active ? "Active" : "Inactive"}
                            </span>
                            <Button variant="outline" size="sm" className="shrink-0" asChild>
                              <Link href={`/vendor/listings/${listing.id}/edit`}>Edit</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-3"
                        >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{(booking as any).listing?.title}</h3>
                          <p className="text-sm text-muted-foreground">{formatDate(booking.booking_date)}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {booking.quantity}</p>
                        </div>
                          <div className="flex flex-col sm:items-end sm:text-right gap-2">
                            <p className="font-semibold">${booking.total_amount.toFixed(2)}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                                booking.status === "confirmed"
                                  ? "bg-accent/10 text-accent"
                                  : booking.status === "pending"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verify">
              <Card>
                <CardHeader>
                  <CardTitle>Verify Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">Scan customer QR codes to verify their bookings</p>
                  <Button asChild>
                    <Link href="/vendor/verify">Open QR Scanner</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet">
              <WalletManagement profile={profile} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8">My Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven&apos;t made any bookings yet</p>
                    <Button asChild>
                      <Link href="/">Start Browsing</Link>
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue="confirmed" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="confirmed">
                        My Tickets ({confirmedBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="pending">
                        Pending ({pendingBookings.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="confirmed" className="space-y-4">
                      {confirmedBookings.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No confirmed bookings yet</p>
                        </div>
                      ) : (
                        confirmedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{(booking as any).listing?.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{(booking as any).listing?.location}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(booking.booking_date)}</p>
                        </div>
                        <div className="flex flex-col sm:items-end sm:text-right gap-2">
                          <p className="font-semibold">${booking.total_amount.toFixed(2)}</p>
                          <div className="flex flex-col sm:items-end gap-2">
                                <span className="text-xs px-2 py-1 rounded whitespace-nowrap bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                                  ✓ Paid
                                </span>
                                {(booking as any).order_id ? (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="text-xs h-7"
                                    asChild
                                  >
                                    <Link href={`/order/${(booking as any).order_id}`}>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      View Ticket & QR Code
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    disabled
                                    title="Order information not available"
                                  >
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    No Order Info
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                      {pendingBookings.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No pending bookings</p>
                        </div>
                      ) : (
                        <>
                          {pendingBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{(booking as any).listing?.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">{(booking as any).listing?.location}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(booking.booking_date)}</p>
                            </div>
                            <div className="flex flex-col sm:items-end sm:text-right gap-2">
                              <p className="font-semibold">${booking.total_amount.toFixed(2)}</p>
                              <div className="flex flex-col sm:items-end gap-2">
                                <span className="text-xs px-2 py-1 rounded whitespace-nowrap bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                                  pending
                            </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => handleResumePayment(booking)}
                                  disabled={cancellingBookingId === booking.id}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Resume Payment
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingBookingId === booking.id}
                                >
                                  {cancellingBookingId === booking.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <X className="h-3 w-3 mr-1" />
                                  )}
                                  Cancel
                                </Button>
                              </div>
                          </div>
                        </div>
                      </div>
                    ))}
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Wallet Management */}
              <WalletManagement profile={profile} />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/profile/recipients">
                      <User className="mr-2 h-4 w-4" />
                      Manage Recipients
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/profile/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      Notification Settings
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/shop">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Browse Services
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/cart">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      View Cart
                    </Link>
                  </Button>

                  {bookings.some(b => b.status === "pending") && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        const pendingBooking = bookings.find(b => b.status === "pending")
                        if (pendingBooking) handleResumePayment(pendingBooking)
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Resume Pending Payment
                    </Button>
                  )}

                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="#claim-faucet">
                      <Coins className="mr-2 h-4 w-4" />
                      Claim Faucet
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Faucet Claim Section */}
        <div id="claim-faucet" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Claim UniTick Faucet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FaucetClaimComponent profile={profile} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
