import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('service_type')
    
    // Build query with optional service type filter
    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        total_tickets,
        capacity,
        service_type,
        bookings:bookings(
          id,
          quantity,
          status
        )
      `)
      .eq("is_active", true)
    
    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }
    
    const { data: listings, error } = await query

    if (error) {
      console.error('[API] Error fetching listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Calculate availability for each listing
    const listingsWithAvailability = listings?.map((listing) => {
      // Count confirmed bookings
      const confirmedBookings = listing.bookings?.filter((booking: any) => booking.status === 'confirmed') || []
      const bookedTickets = confirmedBookings.reduce((sum: number, booking: any) => sum + booking.quantity, 0)
      
      // Calculate remaining tickets
      const totalTickets = listing.total_tickets || listing.capacity || 0
      const remainingTickets = Math.max(0, totalTickets - bookedTickets)
      
      return {
        id: listing.id,
        title: listing.title,
        total_tickets: totalTickets,
        booked_tickets: bookedTickets,
        remaining_tickets: remainingTickets,
        is_sold_out: remainingTickets === 0
      }
    })

    return NextResponse.json({
      success: true,
      listings: listingsWithAvailability
    })

  } catch (error) {
    console.error('[API] Error in ticket-availability:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
