import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔧 Testing confirm_payment_transaction function...')

    // Get the most recent pending order
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)

    if (ordersError || !orders || orders.length === 0) {
      return NextResponse.json({ 
        error: "No pending orders found",
        ordersError: ordersError?.message 
      }, { status: 400 })
    }

    const testOrder = orders[0]
    console.log('Testing with order:', testOrder.id)

    // Get bookings for this order
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("booking_id")
      .eq("order_id", testOrder.id)

    if (orderItemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ 
        error: "No bookings found for order",
        orderItemsError: orderItemsError?.message 
      }, { status: 400 })
    }

    const bookingIds = orderItems.map(oi => oi.booking_id)
    console.log('Testing with bookings:', bookingIds)

    // Test the confirm_payment_transaction function
    const { data, error } = await supabase.rpc('confirm_payment_transaction', {
      p_order_id: testOrder.id,
      p_transaction_hash: 'test_transaction_123',
      p_booking_ids: bookingIds
    })

    if (error) {
      console.error('❌ confirm_payment_transaction failed:', error)
      return NextResponse.json({ 
        success: false,
        error: `confirm_payment_transaction failed: ${error.message}`,
        details: error
      })
    }

    console.log('✅ confirm_payment_transaction succeeded:', data)

    // Check if the order was updated
    const { data: updatedOrder, error: checkError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", testOrder.id)
      .single()

    if (checkError) {
      console.error('❌ Failed to check updated order:', checkError)
      return NextResponse.json({ 
        success: false,
        error: `Failed to check updated order: ${checkError.message}`,
        details: checkError
      })
    }

    console.log('📊 Updated order:', updatedOrder)

    return NextResponse.json({ 
      success: true,
      message: "confirm_payment_transaction function works!",
      originalOrder: testOrder,
      updatedOrder: updatedOrder,
      bookingIds: bookingIds
    })
    
  } catch (error) {
    console.error('Error testing confirm_payment_transaction:', error)
    return NextResponse.json({ 
      success: false,
      error: `Internal server error: ${error.message}`,
      details: error
    })
  }
}
