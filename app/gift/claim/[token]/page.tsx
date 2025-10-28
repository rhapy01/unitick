"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Gift, CheckCircle2, AlertCircle, User, Phone, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sanitizeUserInput } from "@/lib/sanitize"

export default function ClaimGiftPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [giftData, setGiftData] = useState<any>(null)
  const [claimData, setClaimData] = useState({
    name: "",
    phone: "",
    message: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchGiftData = async () => {
      setIsLoading(true)
      
      try {
        // Fetch gift data from database using the token (which is the booking ID)
        const { data: booking, error } = await supabase
          .from('bookings')
          .select(`
            id,
            listing:listings(
              id,
              title,
              price,
              vendor:vendors(
                id,
                business_name
              )
            ),
            quantity,
            total_amount,
            booking_date,
            is_gift,
            recipient_name,
            recipient_email,
            recipient_wallet,
            gift_message,
            nft_contract_address,
            nft_token_id,
            status,
            order_items(
              order:orders(
                id,
                user_id,
                profiles:user_id(
                  full_name,
                  email
                )
              )
            )
          `)
          .eq('id', token)
          .eq('is_gift', true)
          .single()

        if (error) {
          console.error('Error fetching gift data:', error)
          toast({
            title: "Invalid Gift",
            description: "This gift link is invalid or has expired",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        if (!booking) {
          toast({
            title: "Gift Not Found",
            description: "This gift could not be found",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        // Get buyer information from the order
        const buyerData = booking.order_items?.[0]?.order?.profiles
        const buyerName = buyerData?.full_name || 'Someone'

        // Format the gift data
        const giftData = {
          id: booking.id,
          buyer_name: buyerName,
          services: [{
            title: booking.listing?.title || 'Service',
            vendor: booking.listing?.vendor?.business_name || 'Vendor',
            quantity: booking.quantity,
            price: booking.total_amount / booking.quantity,
            booking_date: booking.booking_date
          }],
          total_amount: booking.total_amount,
          gift_message: booking.gift_message,
          nft_contract_address: booking.nft_contract_address,
          nft_token_id: booking.nft_token_id,
          recipient_wallet: booking.recipient_wallet,
          status: booking.status
        }
        
        setGiftData(giftData)
      } catch (error) {
        console.error("Error fetching gift data:", error)
        toast({
          title: "Invalid Gift",
          description: "This gift link is invalid or has expired",
          variant: "destructive",
        })
        router.push("/")
      }
      
      setIsLoading(false)
    }

    fetchGiftData()
  }, [token, router, toast, supabase])

  const handleClaimGift = async () => {
    // Validation
    if (!claimData.name.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    setIsClaiming(true)

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        // User needs to sign up/login first
        toast({
          title: "Authentication Required",
          description: "Please sign up or log in to claim your gift",
          variant: "destructive",
        })
        router.push(`/auth/signup?email=${encodeURIComponent(giftData?.recipient_email || '')}`)
        return
      }

      // Update the gift booking with claimer details
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          claimed_at: new Date().toISOString(),
          claimed_by: user.id,
          claimer_name: claimData.name,
          claimer_phone: claimData.phone,
          claimer_message: claimData.message,
          status: 'claimed',
          updated_at: new Date().toISOString()
        })
        .eq('id', token)
        .eq('is_gift', true)

      if (updateError) {
        throw new Error(`Failed to update gift record: ${updateError.message}`)
      }

      // Update user profile if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: claimData.name,
          phone: claimData.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        console.warn('Failed to update user profile:', profileError)
        // Don't fail the claim if profile update fails
      }

      // Send thank you notification to the buyer
      try {
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', giftData?.order_items?.[0]?.order?.user_id)
          .single()

        if (buyerProfile) {
          // Send notification to buyer that gift was claimed
          await supabase.functions.invoke('send-email', {
            body: {
              to: buyerProfile.email,
              subject: 'Your Gift Has Been Claimed!',
              template: 'gift-claimed',
              data: {
                buyerName: buyerProfile.full_name,
                recipientName: claimData.name,
                serviceTitle: giftData?.services?.[0]?.title,
                thankYouMessage: claimData.message
              }
            }
          })
        }
      } catch (emailError) {
        console.warn('Failed to send thank you notification:', emailError)
        // Don't fail the claim if email fails
      }
      
      setIsClaimed(true)
      toast({
        title: "Gift Claimed Successfully!",
        description: "Your NFT tickets are now in your wallet. Check your dashboard to view them.",
      })
    } catch (error) {
      console.error("Error claiming gift:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim gift. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-muted-foreground">Loading gift details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!giftData) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h1 className="text-2xl font-bold mb-2">Invalid Gift</h1>
                <p className="text-muted-foreground mb-6">
                  This gift link is invalid or has expired
                </p>
                <Button asChild>
                  <a href="/">Go Home</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (isClaimed) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h1 className="text-2xl font-bold mb-2">Gift Claimed Successfully!</h1>
                <p className="text-muted-foreground mb-6">
                  Your NFT tickets are already in your wallet! Check your dashboard to view your tickets.
                </p>
                <div className="space-y-4">
                  <Button asChild>
                    <a href="/">Go Home</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/dashboard">View My Tickets</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">You Received a Gift!</h1>
            <p className="text-muted-foreground">
              {sanitizeUserInput(giftData.buyer_name)} has sent you a gift
            </p>
          </div>

          {/* Gift Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gift Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {giftData.services.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{sanitizeUserInput(service.title)}</h3>
                      <p className="text-sm text-muted-foreground">{sanitizeUserInput(service.vendor)}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Quantity: {service.quantity}</span>
                        <span>${service.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(service.booking_date).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Value</span>
                    <span>${giftData.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {giftData.gift_message && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Message from {sanitizeUserInput(giftData.buyer_name)}:</p>
                    <p className="italic">"{sanitizeUserInput(giftData.gift_message)}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claim Form */}
          <Card>
            <CardHeader>
              <CardTitle>Claim Your Gift</CardTitle>
              <CardDescription>
                Enter your details to claim your NFT tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={claimData.name}
                  onChange={(e) => setClaimData({ ...claimData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={claimData.phone}
                  onChange={(e) => setClaimData({ ...claimData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <Label htmlFor="message">Thank You Message (Optional)</Label>
                <Input
                  id="message"
                  value={claimData.message}
                  onChange={(e) => setClaimData({ ...claimData, message: e.target.value })}
                  placeholder="Thank you for the gift!"
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">About NFT Tickets</p>
                    <p className="text-muted-foreground">
                      Your NFT tickets are already minted and in your wallet! 
                      You can view and use them in your dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleClaimGift}
                disabled={isClaiming}
              >
                {isClaiming ? "Claiming Gift..." : "Claim My Gift"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
