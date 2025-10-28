"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Phone,
  Mail,
  Building,
  ExternalLink
} from "lucide-react"

interface TicketData {
  orderId: string
  status: string
  totalAmount: number
  platformFee: number
  transactionHash: string
  walletAddress: string
  createdAt: string
  customer: {
    name: string
    email: string
  }
  buyer?: {
    name: string
    email: string
  } | null
  bookings: Array<{
    id: string
    serviceTitle: string
    serviceType: string
    quantity: number
    totalAmount: number
    bookingDate: string
    vendor: {
      businessName: string
      contactEmail: string
      phone: string
      location: string
    }
    listing: {
      description: string
      price: number
      location: string
      images: string[]
    }
    nft: {
      contractAddress: string | null
      tokenId: string | null
    }
  }>
}

export default function VerifyTicketPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const response = await fetch(`/api/verify/${orderId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch ticket data")
        }

        setTicketData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket")
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchTicketData()
    }
  }, [orderId])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-card rounded w-1/4 mb-8" />
              <div className="h-64 bg-card rounded mb-4" />
              <div className="h-32 bg-card rounded" />
            </div>
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
          <div className="max-w-2xl mx-auto text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Ticket Not Found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <a href="/">Go Home</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!ticketData) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Valid Ticket</h1>
            <p className="text-muted-foreground">
              This ticket has been verified and is ready for use
            </p>
          </div>

          {/* Order Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ticket Details</span>
                <Badge variant="default" className="bg-accent">
                  {ticketData.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{ticketData.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">${ticketData.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform Fee</p>
                  <p>${ticketData.platformFee.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p>{new Date(ticketData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p>{ticketData.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm">{ticketData.customer.email}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Info - Only show for gift orders */}
              {ticketData.buyer && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Booked By
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer Name</p>
                      <p>{ticketData.buyer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer Email</p>
                      <p className="text-sm">{ticketData.buyer.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Info */}
              {ticketData.transactionHash && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Blockchain Transaction
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                        {ticketData.transactionHash}
                      </p>
                    </div>
                    {ticketData.walletAddress && (
                      <div>
                        <p className="text-sm text-muted-foreground">Wallet Address</p>
                        <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                          {ticketData.walletAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookings */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Bookings</h2>

            {ticketData.bookings.map((booking, index) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>{booking.serviceTitle}</span>
                      <Badge variant="secondary">
                        {booking.serviceType}
                      </Badge>
                    </span>
                    <span className="text-lg font-semibold">
                      ${booking.totalAmount.toFixed(2)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{booking.listing.location}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Quantity: </span>
                        <span className="font-semibold">{booking.quantity}</span>
                      </div>
                    </div>

                    {/* Service Image */}
                    {booking.listing.images?.[0] && (
                      <div className="flex justify-center">
                        <img
                          src={booking.listing.images[0]}
                          alt={booking.serviceTitle}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Vendor Information */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Vendor Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Business Name</p>
                          <p className="font-semibold">{booking.vendor.businessName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p>{booking.vendor.location}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${booking.vendor.contactEmail}`}
                            className="text-sm text-accent hover:underline"
                          >
                            {booking.vendor.contactEmail}
                          </a>
                        </div>
                        {booking.vendor.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${booking.vendor.phone}`}
                              className="text-sm text-accent hover:underline"
                            >
                              {booking.vendor.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* NFT Information */}
                  {booking.nft.contractAddress && booking.nft.tokenId && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">NFT Details</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Contract Address</p>
                          <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                            {booking.nft.contractAddress}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Token ID</p>
                          <p className="font-mono text-xs bg-muted p-2 rounded inline-block">
                            {booking.nft.tokenId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.print()}>
              Print Ticket
            </Button>
            <Button asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit UniTick
              </a>
            </Button>
          </div>

          {/* Verification Notice */}
          <Alert className="mt-6 border-accent">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">
              This ticket has been verified on the blockchain and is valid for use.
              Present this page or the QR code to the vendor for service redemption.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  )
}
