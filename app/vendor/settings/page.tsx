"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { getAllCountries } from "@/lib/jurisdiction"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload, Building2, Phone, Mail, Image, MapPin, FileText, Globe } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function VendorSettingsPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [description, setDescription] = useState("")
  const [physicalAddress, setPhysicalAddress] = useState("")
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("")
  const [jurisdiction, setJurisdiction] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [logo, setLogo] = useState("")
  const [banner, setBanner] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [profileId, setProfileId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const countries = getAllCountries()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendorData = async () => {
      setIsFetching(true)
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

      setProfileId(user.id)

      const { data: vendorData, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error || !vendorData) {
        router.push("/vendor/setup")
        return
      }

      setVendorId(vendorData.id)
      setCompanyName(vendorData.company_name || "")
      setBusinessName(vendorData.business_name || "")
      setDescription(vendorData.description || "")
      setPhysicalAddress(vendorData.physical_address || "")
      setBusinessRegistrationNumber(vendorData.business_registration_number || "")
      setJurisdiction(vendorData.jurisdiction || "")
      setContactEmail(vendorData.contact_email || "")
      setContactPhone(vendorData.contact_phone || "")
      setLogo(vendorData.logo_url || "")
      setBanner(vendorData.banner_url || "")

      // Load profile wallet as well (source of truth)
      const { data: profileWalletData } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single()

      setWalletAddress((profileWalletData?.wallet_address as string) || (vendorData.wallet_address as string) || "")
      setIsFetching(false)
    }

    fetchVendorData()
  }, [router, supabase])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = (data && (data.error || data.message)) || "Failed to upload logo"
        throw new Error(message)
      }

      setLogo(data.url)
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Error uploading logo:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = (data && (data.error || data.message)) || "Failed to upload banner"
        throw new Error(message)
      }

      setBanner(data.url)
      toast({
        title: "Success",
        description: "Banner uploaded successfully",
      })
    } catch (error) {
      console.error("[v0] Error uploading banner:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload banner",
        variant: "destructive",
      })
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) return

    setIsLoading(true)

    try {
      // Basic wallet validation if provided
      const trimmed = walletAddress.trim()
      if (trimmed && !/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        throw new Error("Please enter a valid wallet address (0x + 40 hex chars)")
      }

      const { error } = await supabase
        .from("vendors")
        .update({
          company_name: companyName || businessName,
          business_name: businessName,
          description: description || null,
          physical_address: physicalAddress || null,
          business_registration_number: businessRegistrationNumber || null,
          jurisdiction: jurisdiction || null,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          logo_url: logo || null,
          banner_url: banner || null,
          wallet_address: trimmed || null,
        })
        .eq("id", vendorId)

      if (error) throw error

      // Also persist to profile for the user (kept in sync)
      if (profileId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            wallet_address: trimmed || null,
            wallet_connected_at: trimmed ? new Date().toISOString() : null,
          })
          .eq("id", profileId)
        if (profileError) throw profileError
      }

      toast({
        title: "Settings updated",
        description: "Your vendor profile has been updated successfully.",
      })
    } catch (error) {
      console.error("[v0] Error updating vendor settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 lg:py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Loading your settings...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Back to Dashboard</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Vendor Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your business profile and preferences</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            {/* Business Information */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg lg:text-xl">Business Information</CardTitle>
                    <CardDescription className="text-sm">
                      Update your business details. These will be displayed on your vendor profile.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 lg:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your official company name"
                      required
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be displayed prominently on your profile
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium">
                      Business/Trading Name *
                    </Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="The name you operate under"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Business Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Tell customers about your business, services, and what makes you unique..."
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Help customers understand what you offer and what makes your business special
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessRegistrationNumber" className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Business Registration Number
                    </Label>
                    <Input
                      id="businessRegistrationNumber"
                      value={businessRegistrationNumber}
                      onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                      placeholder="e.g., 12345678"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your official business/company registration number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction" className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Jurisdiction (Country)
                    </Label>
                    <Select value={jurisdiction} onValueChange={setJurisdiction}>
                      <SelectTrigger id="jurisdiction" className="h-11">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.code} - {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The country where your business operates
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physicalAddress" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Physical Address
                  </Label>
                  <Textarea
                    id="physicalAddress"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    rows={3}
                    placeholder="Your complete business physical address including street, city, state/province, and postal code"
                    className="min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Complete address for customer location services and legal compliance
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg lg:text-xl">Contact Information</CardTitle>
                    <CardDescription className="text-sm">
                      How customers can reach you for inquiries and support
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 lg:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      required
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Primary contact email for customer communications
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Business phone number for urgent inquiries
                    </p>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="space-y-2">
                  <Label htmlFor="walletAddress" className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Payout Wallet Address
                  </Label>
                  <Input
                    id="walletAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x... your business wallet address"
                    className="h-11 font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    This wallet will receive payments from orders. Must be an EVM address.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Branding */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg lg:text-xl">Branding & Media</CardTitle>
                    <CardDescription className="text-sm">
                      Customize your vendor profile appearance with logos and banners
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 lg:space-y-8">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Company Logo
                  </Label>

                  {logo ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-border rounded-lg bg-muted/20">
                      <div className="relative">
                        <img
                          src={logo}
                          alt="Logo preview"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setLogo("")}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Current Logo</p>
                        <p className="text-xs text-muted-foreground">Logo is set and will be displayed on your profile</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Upload Company Logo</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 3MB • Recommended: 200x200px</p>
                      </div>
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingLogo}
                        onClick={() => document.getElementById("logoUpload")?.click()}
                        className="mt-3"
                      >
                        {uploadingLogo ? "Uploading..." : "Choose File"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Profile Banner
                  </Label>

                  {banner ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={banner}
                          alt="Banner preview"
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => setBanner("")}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Banner is set and will be displayed at the top of your profile</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Upload Profile Banner</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 3MB • Recommended: 1200x300px</p>
                      </div>
                      <Input
                        id="bannerUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingBanner}
                        onClick={() => document.getElementById("bannerUpload")?.click()}
                        className="mt-3"
                      >
                        {uploadingBanner ? "Uploading..." : "Choose File"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto order-1 sm:order-2 bg-primary hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

