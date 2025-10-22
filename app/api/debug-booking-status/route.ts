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

    const debugData: any = {
      userId: user.id,
      userEmail: user.email,
      walletAddress: "0xeA8f2Eb69d77334fCDFe7ba0826d3bF38050B5Ca",
      specificOrderId: "2a2bfc0d-ea5c-4338-9c35-f5dcc52e872a",
      orders: [],
      bookings: [],
      orderItems: []
    }

    // Check specific order ID mentioned by user
    const { data: specificOrder, error: specificOrderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", "2a2bfc0d-ea5c-4338-9c35-f5dcc52e872a")
      .single()

    debugData.specificOrder = specificOrder
    debugData.specificOrderError = specificOrderError?.message

    // Check bookings for this specific order
    if (specificOrder) {
      const { data: specificOrderItems, error: specificOrderItemsError } = await supabase
        .from("order_items")
        .select("booking_id")
        .eq("order_id", "2a2bfc0d-ea5c-4338-9c35-f5dcc52e872a")

      debugData.specificOrderItems = specificOrderItems
      debugData.specificOrderItemsError = specificOrderItemsError?.message

      if (specificOrderItems && specificOrderItems.length > 0) {
        const bookingIds = specificOrderItems.map(oi => oi.booking_id)
        const { data: specificBookings, error: specificBookingsError } = await supabase
          .from("bookings")
          .select("*")
          .in("id", bookingIds)

        debugData.specificBookings = specificBookings
        debugData.specificBookingsError = specificBookingsError?.message
      }
    }

    // Get all orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    debugData.orders = orders || []
    debugData.ordersError = ordersError?.message

    // Get all bookings for this user
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    debugData.bookings = bookings || []
    debugData.bookingsError = bookingsError?.message

    // Check for orders with the wallet address
    const { data: walletOrders, error: walletOrdersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("wallet_address", "0xeA8f2Eb69d77334fCDFe7ba0826d3bF38050B5Ca")

    debugData.walletOrders = walletOrders || []
    debugData.walletOrdersError = walletOrdersError?.message

    // Check for orders with contract transaction hashes
    const { data: contractOrders, error: contractOrdersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .like("transaction_hash", "contract_%")

    debugData.contractOrders = contractOrders || []
    debugData.contractOrdersError = contractOrdersError?.message

    return NextResponse.json({ 
      success: true, 
      debugData,
      message: "Debug data retrieved"
    })
    
  } catch (error) {
    console.error('Error in debug-booking-status:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}