import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import type { Listing } from "@/lib/types"
import { SERVICE_TYPES } from "@/lib/constants"

interface ServiceCardProps {
  listing: Listing
}

export function ServiceCard({ listing }: ServiceCardProps) {
  const imageUrl =
    listing.images?.[0] || `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(listing.title)}`

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer h-full">
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img src={imageUrl || "/placeholder.svg"} alt={listing.title} className="object-cover w-full h-full" />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
            <Badge variant="secondary" className="shrink-0">
              {SERVICE_TYPES[listing.service_type]}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">${listing.price}</span>
            <span className="text-sm text-muted-foreground">
              / {listing.service_type === "accommodation" ? "night" : "booking"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
