import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()

    const [{ count: listingsCount }, { count: vendorsCount }, { count: bookingsCount }, ratings] = await Promise.all([
      admin.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('vendors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      admin.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
      admin.from('vendor_reviews').select('rating').not('rating', 'is', null),
    ])

    const averageRating = ratings.data && ratings.data.length > 0
      ? ratings.data.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.data.length
      : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalListings: listingsCount ?? 0,
        totalVendors: vendorsCount ?? 0,
        totalBookings: bookingsCount ?? 0,
        averageRating: Math.round(averageRating * 10) / 10,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}


