"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Search, Navigation, Globe, Building, Map } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LocationPickerProps {
  onLocationChange: (location: LocationData) => void
  initialLocation?: LocationData
  showRadius?: boolean
  showCoordinates?: boolean
}

interface LocationData {
  country?: string
  state?: string
  city?: string
  lat?: number
  lng?: number
  radius?: number
  address?: string
}

interface Country {
  code: string
  name: string
  count: number
}

interface State {
  name: string
  count: number
}

interface City {
  name: string
  count: number
}

export function LocationPicker({ 
  onLocationChange, 
  initialLocation,
  showRadius = true,
  showCoordinates = false 
}: LocationPickerProps) {
  const [location, setLocation] = useState<LocationData>(initialLocation || {})
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const { toast } = useToast()

  // Load countries on mount
  useEffect(() => {
    loadCountries()
  }, [])

  // Load states when country changes
  useEffect(() => {
    if (location.country) {
      loadStates(location.country)
    } else {
      setStates([])
      setCities([])
    }
  }, [location.country])

  // Load cities when state changes
  useEffect(() => {
    if (location.country && location.state) {
      loadCities(location.country, location.state)
    } else {
      setCities([])
    }
  }, [location.country, location.state])

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange(location)
  }, [location, onLocationChange])

  const loadCountries = async () => {
    setIsLoadingCountries(true)
    try {
      const response = await fetch('/api/location/data?type=countries')
      const data = await response.json()
      
      if (data.success) {
        setCountries(data.countries)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('[LocationPicker] Error loading countries:', error)
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCountries(false)
    }
  }

  const loadStates = async (countryCode: string) => {
    setIsLoadingStates(true)
    try {
      const response = await fetch(`/api/location/data?type=states&country=${countryCode}`)
      const data = await response.json()
      
      if (data.success) {
        setStates(data.states)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('[LocationPicker] Error loading states:', error)
      toast({
        title: "Error",
        description: "Failed to load states/provinces",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStates(false)
    }
  }

  const loadCities = async (countryCode: string, stateName: string) => {
    setIsLoadingCities(true)
    try {
      const response = await fetch(`/api/location/data?type=cities&country=${countryCode}&state=${encodeURIComponent(stateName)}`)
      const data = await response.json()
      
      if (data.success) {
        setCities(data.cities)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('[LocationPicker] Error loading cities:', error)
      toast({
        title: "Error",
        description: "Failed to load cities",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCities(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      })
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          ...location,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: location.radius || 50
        }
        setLocation(newLocation)
        setUseCurrentLocation(true)
        setIsGettingLocation(false)
        
        toast({
          title: "Location Found",
          description: "Your current location has been detected",
        })
      },
      (error) => {
        console.error('[LocationPicker] Error getting location:', error)
        setIsGettingLocation(false)
        toast({
          title: "Location Error",
          description: "Failed to get your current location",
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const handleLocationChange = (field: keyof LocationData, value: any) => {
    const newLocation = { ...location, [field]: value }
    
    // Clear dependent fields when parent changes
    if (field === 'country') {
      newLocation.state = undefined
      newLocation.city = undefined
    } else if (field === 'state') {
      newLocation.city = undefined
    }
    
    setLocation(newLocation)
  }

  const clearLocation = () => {
    setLocation({})
    setUseCurrentLocation(false)
    setStates([])
    setCities([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            {isGettingLocation ? "Getting Location..." : "Use Current Location"}
          </Button>
          
          {useCurrentLocation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Map className="h-3 w-3" />
              GPS Location
            </Badge>
          )}
        </div>

        {/* Coordinates Display */}
        {showCoordinates && (location.lat && location.lng) && (
          <div className="bg-muted p-3 rounded-lg">
            <Label className="text-sm font-medium">Coordinates</Label>
            <div className="text-sm text-muted-foreground mt-1">
              <div>Latitude: {location.lat.toFixed(6)}</div>
              <div>Longitude: {location.lng.toFixed(6)}</div>
            </div>
          </div>
        )}

        {/* Radius Selector */}
        {showRadius && (location.lat && location.lng) && (
          <div>
            <Label htmlFor="radius">Search Radius</Label>
            <Select
              value={location.radius?.toString() || "50"}
              onValueChange={(value) => handleLocationChange('radius', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
                <SelectItem value="200">200 km</SelectItem>
                <SelectItem value="500">500 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Country Selector */}
        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={location.country || ""}
            onValueChange={(value) => handleLocationChange('country', value)}
            disabled={isLoadingCountries}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center justify-between w-full">
                    <span>{country.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {country.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State/Province Selector */}
        {location.country && (
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Select
              value={location.state || ""}
              onValueChange={(value) => handleLocationChange('state', value)}
              disabled={isLoadingStates}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state/province" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.name} value={state.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{state.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {state.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* City Selector */}
        {location.country && location.state && (
          <div>
            <Label htmlFor="city">City</Label>
            <Select
              value={location.city || ""}
              onValueChange={(value) => handleLocationChange('city', value)}
              disabled={isLoadingCities}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{city.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {city.count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom Address Input */}
        <div>
          <Label htmlFor="address">Custom Address (Optional)</Label>
          <Input
            id="address"
            placeholder="Enter specific address..."
            value={location.address || ""}
            onChange={(e) => handleLocationChange('address', e.target.value)}
          />
        </div>

        {/* Clear Button */}
        {(location.country || location.lat) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearLocation}
            className="w-full"
          >
            Clear Location Filter
          </Button>
        )}

        {/* Location Summary */}
        {(location.country || location.lat) && (
          <div className="bg-muted p-3 rounded-lg">
            <Label className="text-sm font-medium">Current Filter</Label>
            <div className="text-sm text-muted-foreground mt-1">
              {useCurrentLocation && location.lat && location.lng ? (
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  <span>Within {location.radius || 50}km of your location</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>
                    {[location.city, location.state, location.country]
                      .filter(Boolean)
                      .join(', ') || 'All locations'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
