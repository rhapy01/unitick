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
      
      // In a real implementation, you'd decode the token to get gift information
      // For now, we'll simulate fetching gift data
      try {
        // This would be replaced with actual token decoding and database lookup
        const mockGiftData = {
          id: "gift-123",
          buyer_name: "John Doe",
          services: [
            {
              title: "Luxury Hotel Stay",
              vendor: "Grand Hotel",
              quantity: 2,
              price: 150.00,
              booking_date: "2024-02-15"
            },
            {
              title: "City Tour",
              vendor: "Explore Tours",
              quantity: 1,
              price: 75.00,
              booking_date: "2024-02-16"
            }
          ],
          total_amount: 225.00,
          gift_message: "Happy Birthday! Hope you enjoy this amazing trip!",
          nft_contract_address: "0x1234...",
          nft_token_ids: ["1", "2"]
        }
        
        setGiftData(mockGiftData)
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
  }, [token, router, toast])

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
      // In a real implementation, you'd update the gift record with claimer details
      // and transfer the NFT to the claimer's wallet
      
      // Simulate claiming process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsClaimed(true)
      toast({
        title: "Gift Claimed!",
        description: "Your NFT tickets have been transferred to your wallet",
      })
    } catch (error) {
      console.error("Error claiming gift:", error)
      toast({
        title: "Error",
        description: "Failed to claim gift. Please try again.",
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
                  Your NFT tickets have been transferred to your wallet. Check your wallet to view your tickets.
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
                      Your tickets will be minted as NFTs and transferred to your wallet. 
                      You'll need a crypto wallet to receive and use your tickets.
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
