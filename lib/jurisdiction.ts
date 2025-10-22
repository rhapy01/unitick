/**
 * Utility functions for jurisdiction/location handling
 */

interface CountryInfo {
  code: string
  name: string
  flag: string
}

/**
 * Maps country names to their 2-letter codes and flag emojis
 */
const COUNTRY_MAP: Record<string, CountryInfo> = {
  // Africa
  nigeria: { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  uganda: { code: "UG", name: "Uganda", flag: "🇺🇬" },
  kenya: { code: "KE", name: "Kenya", flag: "🇰🇪" },
  ghana: { code: "GH", name: "Ghana", flag: "🇬🇭" },
  "south africa": { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  egypt: { code: "EG", name: "Egypt", flag: "🇪🇬" },
  ethiopia: { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  tanzania: { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  rwanda: { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  
  // North America
  "united states": { code: "US", name: "United States", flag: "🇺🇸" },
  usa: { code: "US", name: "United States", flag: "🇺🇸" },
  canada: { code: "CA", name: "Canada", flag: "🇨🇦" },
  mexico: { code: "MX", name: "Mexico", flag: "🇲🇽" },
  
  // Europe
  "united kingdom": { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  uk: { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  germany: { code: "DE", name: "Germany", flag: "🇩🇪" },
  france: { code: "FR", name: "France", flag: "🇫🇷" },
  italy: { code: "IT", name: "Italy", flag: "🇮🇹" },
  spain: { code: "ES", name: "Spain", flag: "🇪🇸" },
  netherlands: { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  
  // Asia
  india: { code: "IN", name: "India", flag: "🇮🇳" },
  china: { code: "CN", name: "China", flag: "🇨🇳" },
  japan: { code: "JP", name: "Japan", flag: "🇯🇵" },
  singapore: { code: "SG", name: "Singapore", flag: "🇸🇬" },
  thailand: { code: "TH", name: "Thailand", flag: "🇹🇭" },
  malaysia: { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  indonesia: { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  philippines: { code: "PH", name: "Philippines", flag: "🇵🇭" },
  
  // Middle East
  uae: { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  "united arab emirates": { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  dubai: { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  
  // Oceania
  australia: { code: "AU", name: "Australia", flag: "🇦🇺" },
  "new zealand": { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
}

/**
 * Extracts jurisdiction (country code) from a physical address or location string
 */
export function getJurisdictionFromLocation(location: string | null | undefined): CountryInfo | null {
  if (!location) return null

  const normalizedLocation = location.toLowerCase().trim()

  // Try to find a country match in the location string
  for (const [key, info] of Object.entries(COUNTRY_MAP)) {
    if (normalizedLocation.includes(key)) {
      return info
    }
  }

  return null
}

/**
 * Gets the user's country based on their IP/location (client-side)
 * Uses a free geolocation API
 */
export async function getUserCountry(): Promise<CountryInfo | null> {
  try {
    const response = await fetch("https://ipapi.co/json/")
    const data = await response.json()
    
    if (data.country_code && data.country_name) {
      // Find matching country in our map
      const countryInfo = Object.values(COUNTRY_MAP).find(
        c => c.code === data.country_code
      )
      
      if (countryInfo) {
        return countryInfo
      }
      
      // If not in our map, create a basic one
      return {
        code: data.country_code,
        name: data.country_name,
        flag: data.country_code // Will just show code if emoji not available
      }
    }
  } catch (error) {
    console.error("Failed to get user country:", error)
  }
  
  return null
}

/**
 * Sanitizes and formats a country code
 */
export function sanitizeCountryCode(code: string | undefined | null): string {
  if (!code) return ""
  return code.toUpperCase().slice(0, 2)
}

/**
 * Get all available countries for dropdown selection
 * Returns array of {code, name} objects sorted alphabetically
 */
export function getAllCountries(): Array<{ code: string; name: string }> {
  const uniqueCountries = new Map<string, { code: string; name: string }>()

  Object.values(COUNTRY_MAP).forEach(({ code, name }) => {
    if (!uniqueCountries.has(code)) {
      uniqueCountries.set(code, { code, name })
    }
  })

  return Array.from(uniqueCountries.values())
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get country name from code
 */
export function getCountryName(code: string | null | undefined): string | null {
  if (!code) return null
  const country = Object.values(COUNTRY_MAP).find(c => c.code.toLowerCase() === code.toLowerCase())
  return country?.name || null
}

