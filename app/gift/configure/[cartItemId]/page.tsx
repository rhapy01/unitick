"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, Wallet, Mail, Phone, MessageSquare, Calendar, AlertCircle, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { sanitizeUserInput } from "@/lib/sanitize"

export default function GiftConfigurePage({ params }: { params: Promise<{ cartItemId: string }> }) {
  const { cartItemId } = use(params)
  const [cartItem, setCartItem] = useState<any>(null)
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientWallet, setRecipientWallet] = useState("")
  const [giftMessage, setGiftMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCartItem = async () => {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("*, listing:listings(*, vendor:vendors(*))")
        .eq("id", cartItemId)
        .eq("user_id", user.id)
        .single()

      if (error || !data) {
        toast({
          title: "Error",
          description: "Cart item not found",
          variant: "destructive",
        })
        router.push("/cart")
        return
      }

      setCartItem(data)
      // Pre-fill if already configured
      if (data.recipient_name) setRecipientName(data.recipient_name)
      if (data.recipient_email) setRecipientEmail(data.recipient_email)
      if (data.recipient_phone) setRecipientPhone(data.recipient_phone)
      if (data.recipient_wallet) setRecipientWallet(data.recipient_wallet)
      if (data.gift_message) setGiftMessage(data.gift_message)
      
      setIsLoading(false)
    }

    fetchCartItem()
  }, [cartItemId, router, supabase])

  const handleSave = async () => {
    // Validation
    if (!recipientName.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter recipient's name",
        variant: "destructive",
      })
      return
    }

    if (!recipientEmail.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter recipient's email",
        variant: "destructive",
      })
      return
    }

    if (!recipientWallet.trim()) {
      toast({
        title: "Required Field",
        description: "Please enter recipient's wallet address",
        variant: "destructive",
      })
      return
    }

    // Validate wallet address format
    if (!recipientWallet.startsWith("0x") || recipientWallet.length !== 42) {
      toast({
        title: "Invalid Wallet",
        description: "Please enter a valid Ethereum wallet address (0x followed by 40 characters)",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({
          is_gift: true,
          recipient_name: recipientName.trim(),
          recipient_email: recipientEmail.trim(),
          recipient_phone: recipientPhone.trim() || null,
          recipient_wallet: recipientWallet.trim(),
          gift_message: giftMessage.trim() || null,
        })
        .eq("id", cartItemId)

      if (error) throw error

      toast({
        title: "Gift Configured",
        description: "Your gift details have been saved",
      })

      router.push("/gift/checkout")
    } catch (error) {
      console.error("[v0] Error saving gift configuration:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save gift configuration",
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
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!cartItem) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push("/gift/checkout")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Gift Checkout
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Configure Your Gift</h1>
              <p className="text-muted-foreground">Set up the gift details and recipient information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Gift Item</CardTitle>
                  <CardDescription>The service you're gifting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {cartItem.listing.images?.[0] && (
                      <img
                        src={cartItem.listing.images[0]}
                        alt={sanitizeUserInput(cartItem.listing.title)}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{sanitizeUserInput(cartItem.listing.title)}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {sanitizeUserInput(cartItem.listing.vendor?.business_name)}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="secondary">Quantity: {cartItem.quantity}</Badge>
                        <span className="font-semibold text-primary">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recipient Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Recipient Information</CardTitle>
                  <CardDescription>Who will receive this gift?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="recipientName">
                      Recipient Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipientEmail">
                      Recipient Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground" />
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll send the NFT ticket and booking details to this email
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="recipientPhone">Recipient Phone (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground" />
                      <Input
                        id="recipientPhone"
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NFT Wallet Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Recipient's Wallet Address
                  </CardTitle>
                  <CardDescription>Where should we send the NFT ticket?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg bg-primary/5">
                    <AlertCircle className="h-5 w-5 text-primary dark:text-blue-500 gradient:text-pink-500 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium mb-1">NFT Ticket Requirement</p>
                      <p className="text-muted-foreground">
                        Your ticket will be minted as an NFT (Non-Fungible Token) on the blockchain. 
                        The recipient <strong>must have a crypto wallet</strong> to receive and access their ticket.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recipientWallet">
                      Recipient's Wallet Address <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground" />
                      <Input
                        id="recipientWallet"
                        value={recipientWallet}
                        onChange={(e) => setRecipientWallet(e.target.value)}
                        placeholder="0x1234567890abcdef1234567890abcdef12345678"
                        className="pl-10 font-mono text-sm"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      The NFT ticket will be minted directly to this wallet address. Must be a valid Ethereum address.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 gradient:text-amber-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Important</p>
                        <p className="text-muted-foreground">
                          The recipient must have access to this wallet to use their NFT ticket. 
                          Make sure they have the private key or recovery phrase for this wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gift Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Personal Message
                  </CardTitle>
                  <CardDescription>Add a special message to your gift (optional)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Happy Birthday! Hope you enjoy this experience..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{giftMessage.length}/500 characters</p>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Gift Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">{cartItem.listing.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{cartItem.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2 text-sm">What happens next?</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">1.</span>
                        <span>You complete the purchase</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">2.</span>
                        <span>NFT ticket is minted to recipient's wallet</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">3.</span>
                        <span>Recipient receives email with NFT details</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">4.</span>
                        <span>They access their NFT ticket in their wallet</span>
                      </li>
                    </ol>
                  </div>

                  <Button onClick={handleSave} disabled={isSaving} className="w-full bg-accent text-white hover:bg-accent/90" size="lg">
                    {isSaving ? "Saving..." : "Save Gift Configuration"}
                  </Button>

                  <Button variant="outline" onClick={() => router.push("/gift/checkout")} className="w-full">
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

