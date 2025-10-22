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

    // Check your specific order and wallet address
    const { data: specificOrder, error: specificOrderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", "2a2bfc0d-ea5c-4338-9c35-f5dcc52e872a")
      .single()

    // Check orders with your wallet address
    const { data: walletOrders, error: walletOrdersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("wallet_address", "0xeA8f2Eb69d77334fCDFe7ba0826d3bF38050B5Ca")

    // Check bookings for your specific order
    let specificBookings = []
    if (specificOrder) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("booking_id")
        .eq("order_id", "2a2bfc0d-ea5c-4338-9c35-f5dcc52e872a")

      if (orderItems && orderItems.length > 0) {
        const bookingIds = orderItems.map(oi => oi.booking_id)
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .in("id", bookingIds)
        
        specificBookings = bookings || []
      }
    }

    // Run the fix SQL directly
    const { data: fixResult, error: fixError } = await supabase.rpc('sync_booking_status_with_order')

    return NextResponse.json({ 
      success: true,
      specificOrder,
      specificOrderError: specificOrderError?.message,
      walletOrders: walletOrders || [],
      walletOrdersError: walletOrdersError?.message,
      specificBookings,
      fixResult: fixResult?.[0]?.bookings_updated || 0,
      fixError: fixError?.message
    })
    
  } catch (error) {
    console.error('Error in check-and-fix:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
