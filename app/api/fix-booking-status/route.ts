import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the SQL script directly
    const { data, error } = await supabase.rpc('sync_booking_status_with_order')
    
    if (error) {
      console.error('Error running sync function:', error)
      
      // Fallback: Run the SQL directly
      const { data: updateResult, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .select('id')

      if (updateError) {
        return NextResponse.json({ 
          error: "Failed to sync booking status",
          details: updateError.message 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `Fixed ${updateResult?.length || 0} booking statuses`,
        bookingsUpdated: updateResult?.length || 0
      })
    }

    const bookingsUpdated = data?.[0]?.bookings_updated || 0

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${bookingsUpdated} booking statuses`,
      bookingsUpdated 
    })
    
  } catch (error) {
    console.error('Error in fix-booking-status:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}