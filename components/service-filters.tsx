"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Filter, X } from "lucide-react"
import { LocationPicker } from "@/components/location-picker"

interface ServiceFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  minPrice: string
  onMinPriceChange: (value: string) => void
  maxPrice: string
  onMaxPriceChange: (value: string) => void
  location?: any
  onLocationChange?: (location: any) => void
  verifiedOnly?: boolean
  onVerifiedOnlyChange?: (verified: boolean) => void
  showLocationFilter?: boolean
}

export function ServiceFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  location,
  onLocationChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  showLocationFilter = true,
}: ServiceFiltersProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Count active filters
  useEffect(() => {
    let count = 0
    if (searchQuery) count++
    if (minPrice) count++
    if (maxPrice) count++
    if (verifiedOnly) count++
    if (location?.country || location?.lat) count++
    setActiveFiltersCount(count)
  }, [searchQuery, minPrice, maxPrice, verifiedOnly, location])

  const clearAllFilters = () => {
    onSearchChange("")
    onMinPriceChange("")
    onMaxPriceChange("")
    onVerifiedOnlyChange?.(false)
    onLocationChange?.({})
    setShowLocationPicker(false)
  }

  return (
    <div className="space-y-4">
      {/* Main Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="mb-2 block">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <Label htmlFor="sort" className="mb-2 block">
                Sort by
              </Label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="minPrice" className="mb-2 block">
                  Min Price
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice" className="mb-2 block">
                  Max Price
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            {/* Location Filter Button */}
            {showLocationFilter && (
              <Button
                variant={location?.country || location?.lat ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {location?.country || location?.lat ? "Location Set" : "Set Location"}
              </Button>
            )}

            {/* Verified Only Filter */}
            {onVerifiedOnlyChange && (
              <Button
                variant={verifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {verifiedOnly ? "Verified Only" : "All Vendors"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Picker */}
      {showLocationPicker && showLocationFilter && onLocationChange && (
        <LocationPicker
          onLocationChange={onLocationChange}
          initialLocation={location}
          showRadius={true}
          showCoordinates={false}
        />
      )}
    </div>
  )
}
