"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Vendor, Listing } from "@/lib/types"
import { SERVICE_TYPES } from "@/lib/constants"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Package, ShieldCheck, ShieldX, Wallet, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Address } from "viem"

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<Address[]>([])
  const [newWhitelistAddress, setNewWhitelistAddress] = useState("")
  const [isWhitelistLoading, setIsWhitelistLoading] = useState(false)
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

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profileData || profileData.role !== "admin") {
        router.push("/dashboard")
        return
      }

      setProfile(profileData)

      const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      setUsers(usersData || [])

      const { data: vendorsData } = await supabase.from("vendors").select("*").order("created_at", { ascending: false })

      setVendors(vendorsData || [])

      const { data: pendingData } = await supabase
        .from("vendors")
        .select("*")
        .eq("verification_status", "pending")
        .order("verification_applied_at", { ascending: false })

      setPendingVerifications(pendingData || [])

      const { data: listingsData } = await supabase
        .from("listings")
        .select("*, vendor:vendors(*)")
        .order("created_at", { ascending: false })

      setListings(listingsData || [])

      // Fetch whitelisted addresses from contract
      try {
        const countResponse = await fetch('/api/admin/vendor-whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'count' })
        })
        const countData = await countResponse.json()
        
        if (!countData.success) {
          throw new Error(countData.error)
        }
        
        const whitelistCount = countData.count
        const addresses: Address[] = []

        for (let i = 0; i < Number(whitelistCount); i++) {
          try {
            const addressResponse = await fetch('/api/admin/vendor-whitelist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'get', address: i })
            })
            const addressData = await addressResponse.json()
            
            if (addressData.success && addressData.vendor) {
              addresses.push(addressData.vendor)
            }
          } catch (error) {
            console.error(`Error fetching whitelist address at index ${i}:`, error)
          }
        }

        setWhitelistedAddresses(addresses)
      } catch (error) {
        console.error("Error fetching whitelist:", error)
        toast({
          title: "Warning",
          description: "Could not load whitelist data from contract",
          variant: "destructive",
        })
      }

      setIsLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const handleToggleVendorVerification = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("vendors").update({ is_verified: !currentStatus }).eq("id", vendorId)

    if (error) {
      console.error("[v0] Error updating vendor:", error)
      return
    }

    setVendors(vendors.map((v) => (v.id === vendorId ? { ...v, is_verified: !currentStatus } : v)))
  }

  const handleToggleListingStatus = async (listingId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("listings").update({ is_active: !currentStatus }).eq("id", listingId)

    if (error) {
      console.error("[v0] Error updating listing:", error)
      return
    }

    setListings(listings.map((l) => (l.id === listingId ? { ...l, is_active: !currentStatus } : l)))
  }

  const handleAddToWhitelist = async () => {
    if (!newWhitelistAddress.trim()) return

    setIsWhitelistLoading(true)
    try {
      const response = await fetch('/api/admin/vendor-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', address: newWhitelistAddress.trim() })
      })
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      setWhitelistedAddresses([...whitelistedAddresses, newWhitelistAddress.trim() as Address])
      setNewWhitelistAddress("")
      toast({
        title: "Success",
        description: "Address added to whitelist",
      })
    } catch (error) {
      console.error("Error adding to whitelist:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add address to whitelist",
        variant: "destructive",
      })
    } finally {
      setIsWhitelistLoading(false)
    }
  }

  const handleRemoveFromWhitelist = async (address: Address) => {
    setIsWhitelistLoading(true)
    try {
      const response = await fetch('/api/admin/vendor-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', address })
      })
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      setWhitelistedAddresses(whitelistedAddresses.filter(addr => addr !== address))
      toast({
        title: "Success",
        description: "Address removed from whitelist",
      })
    } catch (error) {
      console.error("Error removing from whitelist:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove address from whitelist",
        variant: "destructive",
      })
    } finally {
      setIsWhitelistLoading(false)
    }
  }

  const handleVerificationAction = async (vendorId: string, action: "approved" | "rejected") => {
    const { error } = await supabase
      .from("vendors")
      .update({
        verification_status: action,
        is_verified: action === "approved",
        is_featured: action === "approved",
      })
      .eq("id", vendorId)

    if (error) {
      console.error("[v0] Error updating verification:", error)
      return
    }

    setPendingVerifications(pendingVerifications.filter((v) => v.id !== vendorId))
    setVendors(
      vendors.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              verification_status: action,
              is_verified: action === "approved",
              is_featured: action === "approved",
            }
          : v,
      ),
    )
  }

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

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Access denied</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendors</p>
                  <p className="text-2xl font-bold">{vendors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-2xl font-bold">{listings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="verifications">
              Verifications
              {pendingVerifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingVerifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Pending Verification Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {pendingVerifications.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{vendor.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{vendor.contact_email}</p>
                          {vendor.company_name && (
                            <p className="text-sm text-muted-foreground mt-1">Company: {vendor.company_name}</p>
                          )}
                          {vendor.physical_address && (
                            <p className="text-sm text-muted-foreground">Address: {vendor.physical_address}</p>
                          )}
                          {vendor.business_registration_number && (
                            <p className="text-sm text-muted-foreground">Reg: {vendor.business_registration_number}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied: {new Date(vendor.verification_applied_at || "").toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerificationAction(vendor.id, "approved")}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleVerificationAction(vendor.id, "rejected")}
                          >
                            <ShieldX className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending verifications</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{user.full_name || "No name"}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.role === "admin" ? "default" : user.role === "vendor" ? "secondary" : "outline"}
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>All Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{vendor.business_name}</h3>
                        <p className="text-sm text-muted-foreground">{vendor.contact_email}</p>
                        {vendor.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{vendor.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered: {new Date(vendor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={vendor.is_verified ? "default" : "secondary"}>
                          {vendor.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVendorVerification(vendor.id, vendor.is_verified)}
                        >
                          {vendor.is_verified ? (
                            <>
                              <ShieldX className="mr-2 h-4 w-4" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Verify
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>All Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{listing.title}</h3>
                          <Badge variant="outline">{SERVICE_TYPES[listing.service_type]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{listing.location}</p>
                        <p className="text-sm text-muted-foreground">
                          Vendor: {listing.vendor?.business_name || "Unknown"}
                        </p>
                        <p className="text-sm font-semibold mt-1">${listing.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={listing.is_active ? "default" : "secondary"}>
                          {listing.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleListingStatus(listing.id, listing.is_active)}
                        >
                          {listing.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whitelist">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Vendor Payment Whitelist
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage which wallet addresses are authorized to receive payments on the blockchain.
                    Only whitelisted addresses can receive funds through the UnilaBook contract.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add new address */}
                  <div className="space-y-3">
                    <Label htmlFor="newWhitelistAddress">Add Vendor Address</Label>
                    <div className="flex gap-3">
                      <Input
                        id="newWhitelistAddress"
                        placeholder="0x..."
                        value={newWhitelistAddress}
                        onChange={(e) => setNewWhitelistAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddToWhitelist}
                        disabled={isWhitelistLoading || !newWhitelistAddress.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {isWhitelistLoading ? "Adding..." : "Add"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a valid Ethereum address to allow it to receive payments
                    </p>
                  </div>

                  {/* Current whitelist */}
                  <div className="space-y-3">
                    <Label>Whitelisted Addresses ({whitelistedAddresses.length})</Label>
                    {whitelistedAddresses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No addresses whitelisted yet</p>
                    ) : (
                      <div className="space-y-2">
                        {whitelistedAddresses.map((address, index) => (
                          <div
                            key={address}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono text-xs">
                                {address.slice(0, 6)}...{address.slice(-4)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Address #{index + 1}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromWhitelist(address)}
                              disabled={isWhitelistLoading}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
