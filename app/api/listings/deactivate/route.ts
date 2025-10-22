import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { listingId, reason, notes } = await request.json()
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Call the database function to manually deactivate the listing
    const { data, error } = await supabase.rpc('manual_deactivate_listing', {
      p_listing_id: listingId,
      p_vendor_id: vendor.id,
      p_reason: reason || 'manual_deactivation',
      p_notes: notes || null
    })

    if (error) {
      console.error('[API] Error deactivating listing:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate listing', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Listing not found or already deactivated' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Listing deactivated successfully',
      listingId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[API] Error in manual listing deactivation:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the listing should be expired
    const { data, error } = await supabase.rpc('check_listing_expiration', {
      p_listing_id: listingId
    })

    if (error) {
      console.error('[API] Error checking listing expiration:', error)
      return NextResponse.json(
        { error: 'Failed to check listing expiration', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shouldExpire: data || false,
      listingId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[API] Error checking listing expiration:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

