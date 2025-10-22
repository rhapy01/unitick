"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { SERVICE_TYPES } from "@/lib/constants"
import type { ServiceType } from "@/lib/types"
import { getAllCountries } from "@/lib/jurisdiction"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Store, 
  MapPin, 
  Wallet, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle,
  Building2,
  Globe,
  Grid3x3,
  Sparkles
} from "lucide-react"

export default function VendorSetupPage() {
  const [businessName, setBusinessName] = useState("")
  const [description, setDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [jurisdiction, setJurisdiction] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<ServiceType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const countries = getAllCountries()

  useEffect(() => {
    const checkAuth = async () => {
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
      setContactEmail(user.email || "")
    }

    checkAuth()
  }, [router, supabase.auth])

  const handleCategoryToggle = (category: ServiceType) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      }
      return [...prev, category]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (selectedCategories.length < 1) {
      setError("Please select at least 1 category for your business")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: vendorError } = await supabase.from("vendors").insert({
        user_id: userId,
        business_name: businessName,
        description: description || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        wallet_address: walletAddress,
        jurisdiction: jurisdiction || null,
        categories: selectedCategories,
        is_verified: false,
      })

      if (vendorError) throw vendorError

      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error creating vendor profile:", error)
      setError(error instanceof Error ? error.message : "Failed to create vendor profile")
    } finally {
      setIsLoading(false)
    }
  }

  const categoryDescriptions = {
    accommodation: "Hotels, guest houses, serviced apartments",
    car_hire: "Rental cars, drivers, transportation services",
    tour: "Experiences, sightseeing tours, guided activities",
    cinema: "Movie tickets, screenings, film events",
    event: "Conferences, seminars, workshops, meetups"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-flow gradient-glow mb-6 shadow-2xl">
              <Store className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4 leading-tight">
              Setup Vendor Profile
            </h1>
            <p className="text-muted-foreground text-lg">
              Tell us about your business to start listing services
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <Card className="gradient-card gradient-border">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Business Information</CardTitle>
                    <CardDescription>Basic details about your business</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessName"
                      placeholder="Enter your business name"
                      className="pl-10"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Business Description
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="description"
                      placeholder="Tell customers about your business, services, and what makes you unique..."
                      className="pl-10 min-h-[100px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A good description helps customers understand your offerings
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service Categories */}
            <Card className="gradient-card gradient-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <Grid3x3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Service Categories</CardTitle>
                        <CardDescription>Choose the types of services you offer</CardDescription>
                      </div>
                      {selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="ml-2 gradient-subtle">
                          {selectedCategories.length} selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                    <div
                      key={key}
                      className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                        selectedCategories.includes(key as ServiceType)
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={key}
                          checked={selectedCategories.includes(key as ServiceType)}
                          onCheckedChange={() => handleCategoryToggle(key as ServiceType)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={key}
                            className="text-sm font-semibold leading-none cursor-pointer"
                          >
                            {label}
                          </label>
                          <p className="text-xs text-muted-foreground leading-snug">
                            {categoryDescriptions[key as keyof typeof categoryDescriptions]}
                          </p>
                        </div>
                        {selectedCategories.includes(key as ServiceType) && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  You can select multiple categories for your business
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Contact Information</CardTitle>
                    <CardDescription>How customers can reach you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium">
                    Contact Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="business@example.com"
                      className="pl-10"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium">
                    Contact Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Location & Payment */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Location & Payment</CardTitle>
                    <CardDescription>Where you operate and how you get paid</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="jurisdiction" className="text-sm font-medium">
                    Jurisdiction (Country)
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={jurisdiction} onValueChange={setJurisdiction}>
                      <SelectTrigger id="jurisdiction" className="pl-10">
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
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The country where your business operates
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="walletAddress" className="text-sm font-medium">
                    Crypto Wallet Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="walletAddress"
                      placeholder="0x..."
                      className="pl-10 font-mono text-sm"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <Wallet className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>This is where you&apos;ll receive payments from customers. Make sure you have access to this wallet.</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-14 text-lg font-bold gradient-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Profile...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Create Vendor Profile
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Info Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Your profile will be reviewed before you can start listing services
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
