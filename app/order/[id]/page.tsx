"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Order, Booking } from "@/lib/types"
import { SERVICE_TYPES } from "@/lib/constants"
import { useEffect, useState } from "react"
import { use } from "react"
import { CheckCircle2, Download, Calendar, MapPin, Building, AlertCircle } from "lucide-react"
import Link from "next/link"
import QRCode from "qrcode"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { TicketPDF } from "@/components/ticket-pdf"

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null)
  const [buyer, setBuyer] = useState<{ name: string; email: string } | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Validate order ID format (should be a UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(id)) {
          setError("Invalid order ID format. Order IDs must be in UUID format.")
          setIsLoading(false)
          return
        }

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError("You must be logged in to view this order")
          setIsLoading(false)
          return
        }

        const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single()

        if (orderError) {
          console.error("[v0] Error fetching order:", {
            message: orderError.message,
            details: orderError.details,
            hint: orderError.hint,
            code: orderError.code
          })
          setError(orderError.message || "Failed to fetch order. Order not found or you don't have permission to view it.")
          setIsLoading(false)
          return
        }

        if (!orderData) {
          setError("Order not found")
          setIsLoading(false)
          return
        }

        setOrder(orderData)

        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from("order_items")
          .select("booking_id")
          .eq("order_id", id)

        if (orderItemsError) {
          console.error("[v0] Error fetching order items:", {
            message: orderItemsError.message,
            details: orderItemsError.details,
            hint: orderItemsError.hint,
            code: orderItemsError.code
          })
          setError(orderItemsError.message || "Failed to fetch order items")
          setIsLoading(false)
          return
        }

        const bookingIds = orderItemsData.map((item) => item.booking_id)

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*, listing:listings(*, vendor:vendors(*))")
          .in("id", bookingIds)

        if (bookingsError) {
          console.error("[v0] Error fetching bookings:", {
            message: bookingsError.message,
            details: bookingsError.details,
            hint: bookingsError.hint,
            code: bookingsError.code,
            fullError: JSON.stringify(bookingsError, null, 2),
            bookingIds: bookingIds,
            orderId: id
          })
          setError(`Failed to fetch bookings: ${bookingsError.message || 'Unknown error'}. Please ensure the RLS policy allows users to view bookings in their orders.`)
          setIsLoading(false)
          return
        } else {
          console.log('🔍 Raw bookings data from Supabase:', bookingsData)
          console.log('🔍 First booking recipient fields:', bookingsData?.[0] ? {
            is_gift: bookingsData[0].is_gift,
            recipient_name: bookingsData[0].recipient_name,
            recipient_email: bookingsData[0].recipient_email,
            recipient_wallet: bookingsData[0].recipient_wallet,
            gift_message: bookingsData[0].gift_message
          } : 'No bookings')
          setBookings(bookingsData || [])
          
          // Get customer information - check if this is a gift order first
          const hasGiftBookings = bookingsData.some(booking => booking.is_gift)
          
          console.log('🔍 Order analysis:', {
            orderId: id,
            hasGiftBookings,
            bookingsCount: bookingsData?.length || 0,
            giftBookings: bookingsData?.filter(b => b.is_gift) || [],
            allBookingsWithRecipientInfo: bookingsData?.filter(b => b.recipient_name || b.recipient_email) || []
          })
          
          // Always get buyer information for vendor records
          const { data: buyerData, error: buyerError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', orderData.user_id)
            .single()

          if (buyerData) {
            setBuyer({
              name: buyerData.full_name || 'Unknown',
              email: buyerData.email || 'Unknown'
            })
          }
          
          // Determine customer information - prioritize gift recipient info
          const hasRecipientInfo = bookingsData.some(booking => 
            booking.recipient_name || booking.recipient_email
          )
          
          if (hasGiftBookings || hasRecipientInfo) {
            // For gift orders, use recipient information as primary customer
            const giftBooking = bookingsData.find(booking => 
              booking.is_gift || (booking.recipient_name || booking.recipient_email)
            )
            console.log('🎁 Gift booking found:', giftBooking)
            console.log('🎁 Gift booking recipient fields:', giftBooking ? {
              is_gift: giftBooking.is_gift,
              recipient_name: giftBooking.recipient_name,
              recipient_email: giftBooking.recipient_email,
              recipient_wallet: giftBooking.recipient_wallet
            } : 'No gift booking found')
            
            if (giftBooking && (giftBooking.recipient_name || giftBooking.recipient_email)) {
              const recipientInfo = {
                name: giftBooking.recipient_name || 'Unknown',
                email: giftBooking.recipient_email || 'Unknown'
              }
              console.log('🎁 Setting customer to recipient:', recipientInfo)
              console.log('🎁 Buyer info:', buyerData)
              
              // Check if recipient and buyer are the same person
              if (buyerData && recipientInfo.email.toLowerCase() === buyerData.email.toLowerCase()) {
                console.warn('⚠️ WARNING: Gift recipient and buyer have the same email! This might be a self-gift or data issue.')
                console.warn('Recipient:', recipientInfo)
                console.warn('Buyer:', buyerData)
              }
              
              setCustomer(recipientInfo)
            } else {
              // Fallback to buyer if no recipient info found
              console.log('🎁 No recipient info found, falling back to buyer')
              console.log('🎁 Gift booking was:', giftBooking)
              if (buyerData) {
                setCustomer({
                  name: buyerData.full_name || 'Unknown',
                  email: buyerData.email || 'Unknown'
                })
              }
            }
          } else {
            // Regular order - use buyer's information as customer
            console.log('🛒 Regular order - using buyer info:', buyerData)
            if (buyerData) {
              setCustomer({
                name: buyerData.full_name || 'Unknown',
                email: buyerData.email || 'Unknown'
              })
            }
          }
        }

        // Include NFT refs per booking for on-chain validation
        const nftBookings = (bookingsData || []).map((b: any) => ({
          id: b.id,
          nftContract: b.nft_contract_address || null,
          tokenId: b.nft_token_id || null,
        }))

        // Create URL for ticket verification page with NFT information
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        
        // Include NFT information in QR code for on-chain verification
        const qrData = {
          orderId: id,
          verificationUrl: `${baseUrl}/verify/${id}`,
          nftInfo: bookingsData?.map(booking => ({
            contractAddress: booking.nft_contract_address,
            tokenId: booking.nft_token_id
          })).filter(nft => nft.contractAddress && nft.tokenId) || []
        }
        
        const verificationUrl = `${baseUrl}/verify/${id}`

        // Generate QR code with URL for better scannability
        try {
          const qrUrl = await QRCode.toDataURL(verificationUrl, {
            width: 300,
            margin: 4,
            color: {
              dark: "#000000", // Black QR code on white background for universal scannability
              light: "#FFFFFF",
            },
            errorCorrectionLevel: 'M', // Medium error correction for better reliability
          })

          setQrCodeUrl(qrUrl)

          if (!orderData.qr_code) {
            await supabase.from("orders").update({ qr_code: qrUrl }).eq("id", id)
          }
        } catch (qrError) {
          console.error("Error generating QR code:", qrError)
          // Continue without QR code
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Unexpected error fetching order:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [id, supabase])

  const handleDownloadTicket = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `ticket-${id}.png`
    link.click()
  }

  // Prepare booking data for PDF
  const pdfBookings = bookings.map(booking => {
    console.log('🔍 Booking data for PDF:', {
      bookingId: booking.id,
      isGift: booking.is_gift,
      recipientName: booking.recipient_name,
      recipientEmail: booking.recipient_email,
      listingTitle: booking.listing?.title,
      vendorData: booking.listing?.vendor,
      vendorBusinessName: booking.listing?.vendor?.business_name,
      vendorEmail: booking.listing?.vendor?.contact_email,
      vendorPhysicalAddress: booking.listing?.vendor?.physical_address,
      vendorPhone: booking.listing?.vendor?.phone
    })
    
    return {
      id: booking.id,
      quantity: booking.quantity,
      total_amount: booking.total_amount,
      booking_date: booking.booking_date,
      is_gift: booking.is_gift,
      recipient_name: booking.recipient_name,
      recipient_email: booking.recipient_email,
      recipient_phone: booking.recipient_phone,
      gift_message: booking.gift_message,
      listing: {
        title: booking.listing?.title || 'Unknown Service',
        service_type: booking.listing?.service_type || 'event',
        location: booking.listing?.location || 'Unknown Location',
        price: booking.listing?.price || 0,
        images: booking.listing?.images || []
      },
      vendor: {
        business_name: booking.listing?.vendor?.business_name || 'Unknown Vendor',
        contact_email: booking.listing?.vendor?.contact_email || 'Unknown Email',
        phone: booking.listing?.vendor?.phone,
        physical_address: booking.listing?.vendor?.physical_address || 'Address not provided'
      },
      nft_contract_address: booking.nft_contract_address,
      nft_token_id: booking.nft_token_id
    }
  })

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

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">View My Bookings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Order Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">The order you're looking for could not be found.</p>
              <div className="flex gap-4">
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard">View My Bookings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">Your order has been successfully processed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span>${order.platform_fee_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-green-600 text-white border-green-600 hover:bg-green-700">
                    {order.status}
                  </Badge>
                </div>
                {order.transaction_hash && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground mb-1">Transaction Hash:</p>
                    <p className="font-mono text-xs break-all">{order.transaction_hash}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {bookings.some(booking => booking.is_gift) ? (
                    <div className="flex items-center gap-2">
                      <span>Gift Recipient Information</span>
                      <Badge variant="secondary" className="text-xs">🎁 Gift</Badge>
                    </div>
                  ) : (
                    "Customer Information"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{customer?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{customer?.email || 'Unknown'}</span>
                </div>
                {buyer && bookings.some(booking => booking.is_gift) && (
                  <>
                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground mb-2 font-medium">Purchased By:</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buyer Name:</span>
                      <span className="font-medium">{buyer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buyer Email:</span>
                      <span className="font-medium">{buyer.email}</span>
                    </div>
                    {/* Show warning if customer and buyer are the same */}
                    {customer && buyer && customer.email.toLowerCase() === buyer.email.toLowerCase() && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Same person as recipient</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Digital Ticket</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {qrCodeUrl && (
                  <div className="mb-4">
                    <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code Ticket" className="w-48 h-48" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Show this QR code to vendors to verify your bookings
                </p>
                <div className="space-y-2">
                  <Button onClick={handleDownloadTicket} variant="outline" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
        {order && customer && qrCodeUrl && (
          <>
            {console.log('🎫 PDF Generation Debug:', {
              customer: customer,
              buyer: buyer,
              hasGiftBookings: pdfBookings.some(b => b.is_gift),
              pdfBookingsCount: pdfBookings.length
            })}
            <PDFDownloadLink
            document={
              <TicketPDF
                order={order}
                bookings={pdfBookings}
                customer={customer}
                buyer={buyer}
                qrCodeUrl={qrCodeUrl}
              />
            }
            fileName={`unitick-ticket-${order.id.slice(0, 8)}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" className="w-full bg-transparent" disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                {loading ? 'Generating PDF...' : 'Download PDF Ticket'}
              </Button>
            )}
          </PDFDownloadLink>
          </>
        )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-3 sm:p-4 bg-card/50">
                    {/* Mobile-first layout */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Image */}
                      <div className="w-full sm:w-20 h-32 sm:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {booking.listing?.images?.[0] ? (
                          <img
                            src={booking.listing.images[0]}
                            alt={booking.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg line-clamp-2">{booking.listing?.title}</h3>
                          <Badge variant="secondary" className="text-xs w-fit">{SERVICE_TYPES[booking.listing?.service_type || "event"]}</Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Location:</span>
                            <span className="truncate">{booking.listing?.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Date:</span>
                            <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Service Provider:</span>
                            <span className="truncate">{booking.listing?.vendor?.business_name || 'Unknown Vendor'}</span>
                          </div>
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Qty: </span>
                            <span className="font-medium">{booking.quantity}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-base text-primary">${booking.total_amount.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">View My Bookings</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
