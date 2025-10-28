import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { generateListingMetadata } from "@/lib/seo-utils"
import type { Metadata } from "next"
import { ListingDetailClient } from "./listing-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  
  try {
    const supabase = await createClient()
    const { data: listing } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        location,
        service_type,
        images,
        vendors (
          company_name,
          physical_address
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (!listing) {
      return {
        title: 'Listing Not Found | UniTick',
        description: 'The requested listing could not be found.',
      }
    }

    return generateListingMetadata({
      ...listing,
      vendor: listing.vendors
    })
  } catch (error) {
    return {
      title: 'Listing | UniTick',
      description: 'Browse listings on UniTick - the multi-service booking platform.',
    }
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  
  const supabase = await createClient()
  
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      location,
      service_type,
      images,
      available_from,
      available_to,
      capacity,
      amenities,
      vendors (
        id,
        company_name,
        physical_address,
        logo_url,
        description
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
                <p className="text-muted-foreground mb-4">
                  The listing you're looking for doesn't exist or has been removed.
                </p>
                <Button asChild>
                  <a href="/shop">Browse Listings</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return <ListingDetailClient listing={listing} />
}