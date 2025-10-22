import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface VendorCardProps {
  vendor: {
    id: string
    company_name: string
    physical_address: string
    business_registration_number: string
    logo_url: string | null
    description: string | null
  }
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Card className="overflow-hidden hover:border-primary transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url || "/placeholder.svg"}
                alt={vendor.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">{vendor.company_name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{vendor.company_name}</h3>
                  <div className="relative">
                    <CheckCircle2 className="h-5 w-5 text-[#ff00ff] fill-[#ff00ff] drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {vendor.physical_address}
                </p>
              </div>
            </div>

            {vendor.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.description}</p>
            )}

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">Reg: {vendor.business_registration_number}</p>
              <Button size="sm" asChild>
                <Link href={`/vendor/${vendor.id}/listings`}>View Listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
