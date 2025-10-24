"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, Edit, Shield, UserCheck } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/lib/types"
import { truncateEmail, truncatePhone, formatDisplayName } from "@/lib/user-utils"

interface UserProfileCardProps {
  profile: Profile
  isVendor?: boolean
}

export function UserProfileCard({ profile, isVendor = false }: UserProfileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile/edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="font-semibold truncate">{formatDisplayName(profile.full_name)}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Mail className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{truncateEmail(profile.email || '')}</p>
              <Shield className="h-3 w-3 text-muted-foreground" title="Email truncated for privacy" />
            </div>
          </div>
        </div>

        {/* Phone */}
        {profile.phone && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <Phone className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{truncatePhone(profile.phone)}</p>
                <Shield className="h-3 w-3 text-muted-foreground" title="Phone truncated for privacy" />
              </div>
            </div>
          </div>
        )}

        {/* Role Badge */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Account Type</p>
            <Badge variant={isVendor ? "default" : "secondary"} className="mt-1">
              {isVendor ? "Vendor" : "Customer"}
            </Badge>
          </div>
        </div>

        {/* Wallet Address */}
        {profile.wallet_address && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
              <div className="h-5 w-5 text-orange-500 font-mono text-xs">₿</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
              <p className="font-mono text-sm truncate">
                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


