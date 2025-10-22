"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Package
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Listing {
  id: string
  title: string
  service_type: string
  price: number
  currency: string
  is_active: boolean
  available_dates: string[] | null
  available_to: string | null
  created_at: string
  updated_at: string
  bookings_count?: number
}

interface ListingManagementProps {
  vendorId: string
}

export function ListingManagement({ vendorId }: ListingManagementProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchListings()
  }, [vendorId])

  const fetchListings = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          service_type,
          price,
          currency,
          is_active,
          available_dates,
          available_to,
          created_at,
          updated_at,
          bookings(count)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const listingsWithCounts = data?.map(listing => ({
        ...listing,
        bookings_count: listing.bookings?.[0]?.count || 0
      })) || []

      setListings(listingsWithCounts)
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch listings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkExpirationStatus = (listing: Listing) => {
    if (!listing.is_active) return 'deactivated'
    
    if (listing.available_dates && listing.available_dates.length > 0) {
      const hasFutureDates = listing.available_dates.some(date => 
        new Date(date) >= new Date()
      )
      return hasFutureDates ? 'active' : 'expired'
    }
    
    if (listing.available_to) {
      return new Date(listing.available_to) >= new Date() ? 'active' : 'expired'
    }
    
    return 'active' // No expiration set
  }

  const getExpirationStatus = (listing: Listing) => {
    const status = checkExpirationStatus(listing)
    
    switch (status) {
      case 'expired':
        return {
          badge: <Badge variant="destructive" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expired
          </Badge>,
          alert: <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 gradient:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              This listing has expired and should be deactivated.
            </AlertDescription>
          </Alert>
        }
      case 'deactivated':
        return {
          badge: <Badge variant="secondary" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Deactivated
          </Badge>,
          alert: null
        }
      default:
        return {
          badge: <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>,
          alert: null
        }
    }
  }

  const handleDeactivateListing = async (listingId: string) => {
    try {
      setDeactivatingId(listingId)
      
      const response = await fetch('/api/listings/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          reason: 'manual_deactivation',
          notes: 'Deactivated by vendor'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to deactivate listing')
      }

      toast({
        title: "Success",
        description: "Listing deactivated successfully",
      })

      // Refresh listings
      await fetchListings()
    } catch (error) {
      console.error('Error deactivating listing:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate listing",
        variant: "destructive",
      })
    } finally {
      setDeactivatingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Listings...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Listings</h2>
        <Button asChild>
          <Link href="/vendor/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Create New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground dark:text-muted-foreground gradient:text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first listing to start selling tickets
            </p>
            <Button asChild>
              <Link href="/vendor/listings/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => {
            const status = getExpirationStatus(listing)
            const isExpired = checkExpirationStatus(listing) === 'expired'
            
            return (
              <Card key={listing.id} className={isExpired ? 'border-orange-200 dark:border-orange-800' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{listing.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {status.badge}
                        <Badge variant="outline">
                          {listing.service_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {listing.bookings_count} bookings
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/listing/${listing.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/vendor/listings/edit/${listing.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {listing.is_active && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeactivateListing(listing.id)}
                          disabled={deactivatingId === listing.id}
                        >
                          {deactivatingId === listing.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {status.alert}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Price:</span>
                        <span className="ml-2">{formatCurrency(listing.price, listing.currency)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <span className="ml-2">{formatDate(listing.created_at)}</span>
                      </div>
                      
                      {listing.available_dates && listing.available_dates.length > 0 && (
                        <div className="col-span-2">
                          <span className="font-medium">Available Dates:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {listing.available_dates.map((date, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(date)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {listing.available_to && (
                        <div className="col-span-2">
                          <span className="font-medium">Available Until:</span>
                          <span className="ml-2">{formatDate(listing.available_to)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
