import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'
    const country = searchParams.get('country')
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const limit = searchParams.get('limit') || '20'

    const supabase = await createClient()

    switch (type) {
      case 'stats':
        // Get location statistics
        const { data: statsData, error: statsError } = await supabase.rpc('get_location_stats', {
          country_code_filter: country,
          state_province_filter: state,
          city_filter: city
        })

        if (statsError) {
          console.error('[API] Error fetching location stats:', statsError)
          return NextResponse.json(
            { error: 'Failed to fetch location statistics' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          stats: statsData?.[0] || {
            total_listings: 0,
            total_vendors: 0,
            countries_count: 0,
            states_count: 0,
            cities_count: 0,
            avg_price: 0,
            min_price: 0,
            max_price: 0
          },
          filters: { country, state, city }
        })

      case 'popular':
        // Get popular locations
        const { data: popularData, error: popularError } = await supabase.rpc('get_popular_locations', {
          limit_count: parseInt(limit)
        })

        if (popularError) {
          console.error('[API] Error fetching popular locations:', popularError)
          return NextResponse.json(
            { error: 'Failed to fetch popular locations' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          locations: popularData || [],
          total: popularData?.length || 0
        })

      case 'countries':
        // Get list of countries with listing counts
        const { data: countriesData, error: countriesError } = await supabase
          .from('listings')
          .select('country_code')
          .eq('is_active', true)
          .not('country_code', 'is', null)

        if (countriesError) {
          console.error('[API] Error fetching countries:', countriesError)
          return NextResponse.json(
            { error: 'Failed to fetch countries' },
            { status: 500 }
          )
        }

        // Count occurrences of each country
        const countryCounts = countriesData?.reduce((acc: any, item: any) => {
          acc[item.country_code] = (acc[item.country_code] || 0) + 1
          return acc
        }, {}) || {}

        const countries = Object.entries(countryCounts).map(([code, count]) => ({
          code,
          count,
          name: getCountryName(code)
        }))

        return NextResponse.json({
          success: true,
          countries: countries.sort((a: any, b: any) => b.count - a.count),
          total: countries.length
        })

      case 'states':
        // Get list of states/provinces for a country
        if (!country) {
          return NextResponse.json(
            { error: 'Country code is required for states' },
            { status: 400 }
          )
        }

        const { data: statesData, error: statesError } = await supabase
          .from('listings')
          .select('state_province')
          .eq('is_active', true)
          .eq('country_code', country)
          .not('state_province', 'is', null)

        if (statesError) {
          console.error('[API] Error fetching states:', statesError)
          return NextResponse.json(
            { error: 'Failed to fetch states' },
            { status: 500 }
          )
        }

        // Count occurrences of each state
        const stateCounts = statesData?.reduce((acc: any, item: any) => {
          acc[item.state_province] = (acc[item.state_province] || 0) + 1
          return acc
        }, {}) || {}

        const states = Object.entries(stateCounts).map(([name, count]) => ({
          name,
          count
        }))

        return NextResponse.json({
          success: true,
          states: states.sort((a: any, b: any) => b.count - a.count),
          total: states.length,
          country
        })

      case 'cities':
        // Get list of cities for a state/country
        if (!country) {
          return NextResponse.json(
            { error: 'Country code is required for cities' },
            { status: 400 }
          )
        }

        let citiesQuery = supabase
          .from('listings')
          .select('city')
          .eq('is_active', true)
          .eq('country_code', country)
          .not('city', 'is', null)

        if (state) {
          citiesQuery = citiesQuery.eq('state_province', state)
        }

        const { data: citiesData, error: citiesError } = await citiesQuery

        if (citiesError) {
          console.error('[API] Error fetching cities:', citiesError)
          return NextResponse.json(
            { error: 'Failed to fetch cities' },
            { status: 500 }
          )
        }

        // Count occurrences of each city
        const cityCounts = citiesData?.reduce((acc: any, item: any) => {
          acc[item.city] = (acc[item.city] || 0) + 1
          return acc
        }, {}) || {}

        const cities = Object.entries(cityCounts).map(([name, count]) => ({
          name,
          count
        }))

        return NextResponse.json({
          success: true,
          cities: cities.sort((a: any, b: any) => b.count - a.count),
          total: cities.length,
          country,
          state
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('[API] Error in location data:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get country name from code
function getCountryName(code: string): string {
  const countryNames: { [key: string]: string } = {
    'NG': 'Nigeria',
    'UG': 'Uganda',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'ZA': 'South Africa',
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'GR': 'Greece',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
    'CY': 'Cyprus',
    'MT': 'Malta',
    'LU': 'Luxembourg'
  }
  
  return countryNames[code] || code
}
