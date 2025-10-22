"use client"

import { Header } from "@/components/header"
import { verifyNftOwnership } from "@/lib/nft"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Scan, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function VerifyTicketPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [qrData, setQrData] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle")
  const [verificationMessage, setVerificationMessage] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

      setUserId(user.id)

      const { data: vendorData, error: vendorError } = await supabase.from("vendors").select("id").eq("user_id", user.id).single()

      if (vendorError) {
        console.error("Error fetching vendor:", vendorError)
        router.push("/vendor/setup")
        return
      }

      if (!vendorData) {
        router.push("/vendor/setup")
        return
      }

      setVendorId(vendorData.id)
    }

    checkVendor()
  }, [router, supabase])

  const handleVerify = async () => {
    if (!qrData || !vendorId || !userId) return

    setIsVerifying(true)
    setVerificationStatus("idle")
    setVerificationMessage("")

    try {
      let orderId: string

      // Check if the QR data is a URL (new format) or JSON (old format)
      if (qrData.startsWith('http')) {
        // Extract order ID from URL like: https://domain.com/verify/order-123
        const url = new URL(qrData)
        const pathParts = url.pathname.split('/')
        const verifyIndex = pathParts.indexOf('verify')
        if (verifyIndex !== -1 && pathParts[verifyIndex + 1]) {
          orderId = pathParts[verifyIndex + 1]
        } else {
          throw new Error("Invalid verification URL")
        }
      } else {
        // Fallback to old JSON format for backward compatibility
        const parsedData = JSON.parse(qrData)
        orderId = parsedData.orderId

        if (!orderId) {
          throw new Error("Invalid QR code data")
        }
      }

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError || !orderData) {
        throw new Error("Order not found")
      }

      if (orderData.status !== "confirmed") {
        throw new Error("Order is not confirmed")
      }

      // Get booking IDs from order items
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("booking_id")
        .eq("order_id", orderId)

      if (orderItemsError) {
        throw new Error("Failed to fetch order items")
      }

      const bookingIds = orderItems.map(item => item.booking_id)

      // Fetch bookings for this vendor
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*, listing:listings(*)")
        .in("id", bookingIds)
        .eq("vendor_id", vendorId)

      if (bookingsError) {
        throw new Error("Failed to verify bookings")
      }

      if (!bookingsData || bookingsData.length === 0) {
        throw new Error("No bookings found for this vendor")
      }

      // Optional on-chain NFT validation
      const { data: nftBookings } = await supabase
        .from("bookings")
        .select("nft_contract_address, nft_token_id")
        .in("id", bookingIds)

      if (nftBookings) {
        for (const booking of nftBookings) {
          if (booking.nft_contract_address && booking.nft_token_id && orderData.wallet_address) {
            const ok = await verifyNftOwnership(
              booking.nft_contract_address,
              BigInt(booking.nft_token_id),
              orderData.wallet_address as `0x${string}`
            )
            if (!ok) {
              throw new Error("NFT ownership check failed for a booking")
            }
          }
        }
      }

      // Record the verification
      const { error: verificationError } = await supabase.from("ticket_verifications").insert({
        order_id: orderId,
        vendor_id: vendorId,
        verified_by: userId,
      })

      if (verificationError) {
        console.error("[v0] Verification insert error:", verificationError)
      }

      setVerificationStatus("success")
      setVerificationMessage(
        `Verified ${bookingsData.length} booking(s) for order ${orderId.slice(0, 8)}. Total: $${orderData.total_amount.toFixed(2)}`,
      )
    } catch (error) {
      console.error("[v0] Verification error:", error)
      setVerificationStatus("error")
      setVerificationMessage(error instanceof Error ? error.message : "Failed to verify ticket")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-8">Verify Ticket</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="qrData">Paste QR Code Data</Label>
                  <Textarea
                    id="qrData"
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    placeholder='https://unitick.com/verify/order-123 or {"orderId":"..."}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan the customer&apos;s QR code or paste the verification URL here
                  </p>
                </div>

                <Button onClick={handleVerify} disabled={!qrData || isVerifying} className="w-full bg-accent text-white hover:bg-accent/90">
                  {isVerifying ? "Verifying..." : "Verify Ticket"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {verificationStatus === "success" && (
            <Alert className="border-accent">
              <CheckCircle2 className="h-4 w-4 text-icon-primary" />
              <AlertDescription className="text-accent">{verificationMessage}</AlertDescription>
            </Alert>
          )}

          {verificationStatus === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{verificationMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}
