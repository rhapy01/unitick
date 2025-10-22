"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet, ArrowLeft, Gift, AlertCircle, CheckCircle2, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { sanitizeUserInput, sanitizePrice, sanitizeQuantity } from "@/lib/sanitize"
import { PLATFORM_FEE_PERCENTAGE, SERVICE_TYPES } from "@/lib/constants"

interface SavedRecipient {
  id: string
  name: string
  email: string
  wallet_address: string
  is_default: boolean
}

export default function SimpleGiftCheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [newRecipient, setNewRecipient] = useState({
    name: "",
    email: "",
    wallet_address: ""
  })
  const [useNewRecipient, setUseNewRecipient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch selected cart items (gift items)
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("id, quantity, booking_date, listing:listings(*, vendor:vendors(*))")
        .eq("user_id", user.id)
        .eq("is_gift", true)

      if (cartError) {
        console.error("Error fetching cart items:", cartError)
        router.push("/cart")
        return
      }

      if (!cartData || cartData.length === 0) {
        router.push("/cart")
        return
      }

      setCartItems(cartData)

      // Fetch saved recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from("saved_recipients")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (recipientsError) {
        console.error("Error fetching recipients:", recipientsError)
      } else {
        setSavedRecipients(recipientsData || [])
        // Set default recipient if available
        const defaultRecipient = recipientsData?.find(r => r.is_default)
        if (defaultRecipient) {
          setSelectedRecipient(defaultRecipient.id)
        }
      }

      // Check for internal wallet
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single()
      
      if (profile?.wallet_address) {
        setWalletConnected(true)
        setWalletAddress(profile.wallet_address)
      } else {
        setWalletConnected(false)
        setWalletAddress(null)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.listing.price * item.quantity, 0)
  }

  const calculatePlatformFee = () => {
    return calculateSubtotal() * PLATFORM_FEE_PERCENTAGE
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculatePlatformFee()
  }

  const handleProceedToPayment = async () => {
    // Validation
    if (!useNewRecipient && !selectedRecipient) {
      toast({
        title: "Select Recipient",
        description: "Please select a recipient or enter new recipient details",
        variant: "destructive",
      })
      return
    }

    if (useNewRecipient) {
      if (!newRecipient.name.trim() || !newRecipient.email.trim() || !newRecipient.wallet_address.trim()) {
        toast({
          title: "Required Fields",
          description: "Please fill in all recipient details",
          variant: "destructive",
        })
        return
      }

      // Validate wallet address
      if (!newRecipient.wallet_address.startsWith("0x") || newRecipient.wallet_address.length !== 42) {
        toast({
          title: "Invalid Wallet",
          description: "Please enter a valid Ethereum wallet address",
          variant: "destructive",
        })
        return
      }
    }

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let recipientData
      if (useNewRecipient) {
        recipientData = newRecipient
      } else {
        const recipient = savedRecipients.find(r => r.id === selectedRecipient)
        if (!recipient) {
          toast({
            title: "Error",
            description: "Selected recipient not found",
            variant: "destructive",
          })
          return
        }
        recipientData = {
          name: recipient.name,
          email: recipient.email,
          wallet_address: recipient.wallet_address
        }
      }

      // Update all gift items with recipient details
      const { error } = await supabase
        .from("cart_items")
        .update({
          recipient_name: recipientData.name,
          recipient_email: recipientData.email,
          recipient_wallet: recipientData.wallet_address,
        })
        .eq("user_id", user.id)
        .eq("is_gift", true)

      if (error) throw error

      // Redirect to payment
      router.push("/payment")
    } catch (error) {
      console.error("Error updating gift details:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update gift details",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/cart">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Cart
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gift Checkout</h1>
              <p className="text-muted-foreground">Select recipient and complete your gift purchase</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gift Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Gift Items</CardTitle>
                  <CardDescription>Services you're purchasing as gifts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartItems.map((item, index) => {
                      const itemTotal = item.listing.price * item.quantity
                      return (
                        <div key={index} className="flex gap-4 p-4 border rounded-lg">
                          {item.listing.images?.[0] && (
                            <img
                              src={item.listing.images[0]}
                              alt={sanitizeUserInput(item.listing.title)}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{sanitizeUserInput(item.listing.title)}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {sanitizeUserInput(item.listing.vendor?.business_name)}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="secondary">{SERVICE_TYPES[item.listing.service_type]}</Badge>
                              <span>Quantity: {sanitizeQuantity(item.quantity)}</span>
                              <span className="font-semibold text-primary">${sanitizePrice(itemTotal).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recipient Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipient</CardTitle>
                  <CardDescription>Choose who will receive these gifts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedRecipients.length > 0 && (
                    <div>
                      <Label>Saved Recipients</Label>
                      <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a saved recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedRecipients.map((recipient) => (
                            <SelectItem key={recipient.id} value={recipient.id}>
                              <div className="flex items-center gap-2">
                                <span>{sanitizeUserInput(recipient.name)}</span>
                                {recipient.is_default && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-new"
                      checked={useNewRecipient}
                      onChange={(e) => setUseNewRecipient(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="use-new">Enter new recipient details</Label>
                  </div>

                  {useNewRecipient && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div>
                        <Label htmlFor="new-name">Recipient Name</Label>
                        <Input
                          id="new-name"
                          value={newRecipient.name}
                          onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="new-email">Recipient Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newRecipient.email}
                          onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                          placeholder="john@example.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="new-wallet">Recipient Wallet Address</Label>
                        <Input
                          id="new-wallet"
                          value={newRecipient.wallet_address}
                          onChange={(e) => setNewRecipient({ ...newRecipient, wallet_address: e.target.value })}
                          placeholder="0x1234567890abcdef1234567890abcdef12345678"
                          className="font-mono text-sm"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          NFT tickets will be minted to this wallet address
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">What happens next?</p>
                        <p className="text-muted-foreground">
                          After payment, the recipient will receive an email with instructions to claim their NFT tickets. 
                          They'll enter their own details (name, phone, etc.) when claiming.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Gift Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items</span>
                      <span>{cartItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${sanitizePrice(calculateSubtotal()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee (0.5%)</span>
                      <span>${sanitizePrice(calculatePlatformFee()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                      <span>Total</span>
                      <span>${sanitizePrice(calculateTotal()).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#E4405F]/10 rounded-lg border border-[#E4405F]/30">
                    <p className="text-sm text-[#E4405F] font-medium mb-1">🎁 Gift Purchase</p>
                    <p className="text-xs text-muted-foreground">
                      NFT tickets will be minted to recipient's wallet after payment
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleProceedToPayment}
                    disabled={!walletConnected || isSaving}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {isSaving ? "Processing..." : walletConnected ? "Proceed to Payment" : "Connect Wallet to Pay"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Payment will be processed with cryptocurrency
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
