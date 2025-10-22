"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { SERVICE_TYPES } from "@/lib/constants"
import type { ServiceType } from "@/lib/types"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function VendorProfilePage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [currentCategories, setCurrentCategories] = useState<ServiceType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<ServiceType[]>([])
  const [categoriesUpdatedAt, setCategoriesUpdatedAt] = useState<string | null>(null)
  const [canUpdate, setCanUpdate] = useState(false)
  const [daysUntilUpdate, setDaysUntilUpdate] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkVendor = async () => {
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

      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id, categories, categories_updated_at")
        .eq("user_id", user.id)
        .single()

      if (!vendorData) {
        router.push("/vendor/setup")
        return
      }

      setVendorId(vendorData.id)
      setCurrentCategories(vendorData.categories || [])
      setSelectedCategories(vendorData.categories || [])
      setCategoriesUpdatedAt(vendorData.categories_updated_at)

      const hasCategories = vendorData.categories && vendorData.categories.length > 0

      if (!hasCategories) {
        // First time setting categories - allow update
        setCanUpdate(true)
        setDaysUntilUpdate(0)
      } else if (vendorData.categories_updated_at) {
        // Categories exist - check if 60 days have passed
        const lastUpdate = new Date(vendorData.categories_updated_at)
        const now = new Date()
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
        const daysRemaining = 60 - daysSinceUpdate

        setCanUpdate(daysSinceUpdate >= 60)
        setDaysUntilUpdate(Math.max(0, daysRemaining))
      } else {
        // Has categories but no timestamp (shouldn't happen, but allow update)
        setCanUpdate(true)
        setDaysUntilUpdate(0)
      }
    }

    checkVendor()
  }, [router, supabase])

  const handleCategoryToggle = (category: ServiceType) => {
    if (!canUpdate) return

    setSelectedCategories((prev) => {
      const newCategories = [...prev]
      const index = newCategories.indexOf(category)
      
      if (index > -1) {
        // Remove category
        newCategories.splice(index, 1)
      } else {
        // Add category (max 2)
        if (newCategories.length < 2) {
          newCategories.push(category)
        } else {
          // Replace the first category with the new one
          newCategories[0] = category
        }
      }
      
      return newCategories
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId || !canUpdate) return

    if (selectedCategories.length < 1) {
      setError("Please select at least 1 category")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("vendors")
        .update({
          categories: selectedCategories,
          categories_updated_at: new Date().toISOString(),
        })
        .eq("id", vendorId)

      if (updateError) throw updateError

      setSuccess("Categories updated successfully! You can update again in 60 days.")
      setCurrentCategories(selectedCategories)
      setCanUpdate(false)
      setDaysUntilUpdate(60)
      setCategoriesUpdatedAt(new Date().toISOString())
    } catch (error) {
      console.error("[v0] Error updating categories:", error)
      setError(error instanceof Error ? error.message : "Failed to update categories")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-8">Vendor Profile</h1>

          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>
                {currentCategories.length === 0
                  ? "Select your service categories (you must choose exactly 2)"
                  : canUpdate
                    ? "Update your service categories (you can do this once every 60 days)"
                    : `You can update your categories again in ${daysUntilUpdate} days`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canUpdate && currentCategories.length > 0 && (
                <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 gradient:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-500">Category Update Locked</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You last updated your categories on {new Date(categoriesUpdatedAt!).toLocaleDateString()}. You can
                      update them again in {daysUntilUpdate} days.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  {currentCategories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Current Categories:</p>
                      <div className="flex gap-2">
                        {currentCategories.map((cat) => (
                          <span key={cat} className="px-3 py-1 bg-primary/20 text-primary rounded-md text-sm">
                            {SERVICE_TYPES[cat]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-3">
                    {canUpdate ? "Select at least 1 category for your business" : "Categories are locked for editing"}
                  </p>

                  <div className="space-y-3">
                    {Object.entries(SERVICE_TYPES).map(([key, label]) => (
                      <div key={key} className="flex items-start space-x-3">
                        <Checkbox
                          id={key}
                          checked={selectedCategories.includes(key as ServiceType)}
                          onCheckedChange={() => handleCategoryToggle(key as ServiceType)}
                          disabled={!canUpdate}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={key}
                            className={`text-sm font-medium leading-none ${
                              canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                            }`}
                          >
                            {label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {key === "accommodation" && "Hotels, guest houses, serviced apartments"}
                            {key === "car_hire" && "Rental cars, drivers, pickups"}
                            {key === "tour" && "Experiences, sightseeing, guides"}
                            {key === "cinema" && "Movie tickets (list shows and times)"}
                            {key === "event" && "Conferences, seminars, meetups (not venues)"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Selected: {selectedCategories.length}/2</p>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">{success}</p>}

                <Button type="submit" className="w-full bg-accent text-white hover:bg-accent/90" disabled={isLoading || !canUpdate}>
                  {isLoading ? "Updating Categories..." : canUpdate ? "Update Categories" : "Update Locked"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
