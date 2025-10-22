import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '50'
    const serviceType = searchParams.get('serviceType')
    const country = searchParams.get('country')
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const sortBy = searchParams.get('sortBy') || 'distance'

    const supabase = await createClient()

    // If coordinates provided, use proximity search
    if (lat && lng) {
      const { data, error } = await supabase.rpc('find_listings_near_location', {
        user_lat: parseFloat(lat),
        user_lon: parseFloat(lng),
        radius_km: parseInt(radius),
        service_type_filter: serviceType,
        country_filter: country
      })

      if (error) {
        console.error('[API] Error finding listings near location:', error)
        return NextResponse.json(
          { error: 'Failed to find listings near location' },
          { status: 500 }
        )
      }

      // Sort results based on sortBy parameter
      let sortedData = data || []
      switch (sortBy) {
        case 'price-low':
          sortedData.sort((a: any, b: any) => a.price - b.price)
          break
        case 'price-high':
          sortedData.sort((a: any, b: any) => b.price - a.price)
          break
        case 'newest':
          // Note: This would require additional data from listings table
          break
        case 'distance':
        default:
          // Already sorted by distance from the function
          break
      }

      return NextResponse.json({
        success: true,
        listings: sortedData,
        total: sortedData.length,
        searchParams: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius: parseInt(radius),
          serviceType,
          country,
          sortBy
        }
      })
    }

    // If no coordinates, use location-based filtering
    let query = supabase
      .from('listings')
      .select(`
        *,
        vendor:vendors(
          id,
          business_name,
          is_verified,
          city,
          state_province,
          country_code
        )
      `)
      .eq('is_active', true)

    // Apply filters
    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }
    if (country) {
      query = query.eq('country_code', country)
    }
    if (state) {
      query = query.eq('state_province', state)
    }
    if (city) {
      query = query.eq('city', city)
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'location':
        query = query.order('city', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[API] Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      listings: data || [],
      total: data?.length || 0,
      searchParams: {
        serviceType,
        country,
        state,
        city,
        sortBy
      }
    })

  } catch (error) {
    console.error('[API] Error in location search:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      lat, 
      lng, 
      radius = 50, 
      serviceType, 
      country, 
      state, 
      city,
      sortBy = 'distance',
      filters = {}
    } = body

    const supabase = await createClient()

    // If coordinates provided, use proximity search
    if (lat && lng) {
      const { data, error } = await supabase.rpc('find_listings_near_location', {
        user_lat: parseFloat(lat),
        user_lon: parseFloat(lng),
        radius_km: parseInt(radius),
        service_type_filter: serviceType,
        country_filter: country
      })

      if (error) {
        console.error('[API] Error finding listings near location:', error)
        return NextResponse.json(
          { error: 'Failed to find listings near location' },
          { status: 500 }
        )
      }

      // Apply additional filters
      let filteredData = data || []
      
      // Price range filter
      if (filters.minPrice) {
        filteredData = filteredData.filter((item: any) => item.price >= filters.minPrice)
      }
      if (filters.maxPrice) {
        filteredData = filteredData.filter((item: any) => item.price <= filters.maxPrice)
      }

      // Vendor verification filter
      if (filters.verifiedOnly) {
        filteredData = filteredData.filter((item: any) => item.vendor_verified)
      }

      // Sort results
      switch (sortBy) {
        case 'price-low':
          filteredData.sort((a: any, b: any) => a.price - b.price)
          break
        case 'price-high':
          filteredData.sort((a: any, b: any) => b.price - a.price)
          break
        case 'distance':
        default:
          // Already sorted by distance from the function
          break
      }

      return NextResponse.json({
        success: true,
        listings: filteredData,
        total: filteredData.length,
        searchParams: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius: parseInt(radius),
          serviceType,
          country,
          sortBy,
          filters
        }
      })
    }

    // If no coordinates, use location-based filtering
    let query = supabase
      .from('listings')
      .select(`
        *,
        vendor:vendors(
          id,
          business_name,
          is_verified,
          city,
          state_province,
          country_code
        )
      `)
      .eq('is_active', true)

    // Apply filters
    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }
    if (country) {
      query = query.eq('country_code', country)
    }
    if (state) {
      query = query.eq('state_province', state)
    }
    if (city) {
      query = query.eq('city', city)
    }

    // Price range filter
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }

    // Vendor verification filter
    if (filters.verifiedOnly) {
      query = query.eq('vendor.is_verified', true)
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'location':
        query = query.order('city', { ascending: true })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[API] Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      listings: data || [],
      total: data?.length || 0,
      searchParams: {
        serviceType,
        country,
        state,
        city,
        sortBy,
        filters
      }
    })

  } catch (error) {
    console.error('[API] Error in location search:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
