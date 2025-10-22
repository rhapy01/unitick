import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Checking database state for user:', user.id)

    // Get all orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Get all bookings for this user
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*, listing:listings(*, vendor:vendors(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    // Get order items to link bookings to orders
    const bookingIds = bookings?.map(b => b.id) || []
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("booking_id, order_id")
      .in("booking_id", bookingIds)

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError)
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 })
    }

    // Analyze the data
    const analysis = {
      userId: user.id,
      userEmail: user.email,
      ordersCount: orders?.length || 0,
      bookingsCount: bookings?.length || 0,
      orderItemsCount: orderItems?.length || 0,
      orders: orders?.map(order => ({
        id: order.id,
        status: order.status,
        transaction_hash: order.transaction_hash,
        total_amount: order.total_amount,
        created_at: order.created_at,
        nft_batch_id: order.nft_batch_id
      })),
      bookings: bookings?.map(booking => {
        const orderItem = orderItems?.find(oi => oi.booking_id === booking.id)
        return {
          id: booking.id,
          status: booking.status,
          order_id: orderItem?.order_id,
          nft_token_id: booking.nft_token_id,
          nft_contract_address: booking.nft_contract_address,
          created_at: booking.created_at
        }
      }),
      issues: []
    }

    // Check for data consistency issues
    if (orders) {
      const confirmedOrders = orders.filter(o => o.status === 'confirmed')
      const pendingOrders = orders.filter(o => o.status === 'pending')
      
      analysis.issues.push(`Found ${confirmedOrders.length} confirmed orders, ${pendingOrders.length} pending orders`)
      
      // Check for orders with contract transaction hashes
      const contractOrders = orders.filter(o => o.transaction_hash?.startsWith('contract_'))
      analysis.issues.push(`Found ${contractOrders.length} orders with contract transaction hashes`)
    }

    if (bookings) {
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
      const pendingBookings = bookings.filter(b => b.status === 'pending')
      
      analysis.issues.push(`Found ${confirmedBookings.length} confirmed bookings, ${pendingBookings.length} pending bookings`)
      
      // Check for bookings with NFT data
      const nftBookings = bookings.filter(b => b.nft_token_id)
      analysis.issues.push(`Found ${nftBookings.length} bookings with NFT token IDs`)
    }

    console.log('📊 Database Analysis:', analysis)

    return NextResponse.json({ 
      success: true, 
      analysis,
      message: "Database state analyzed successfully"
    })
    
  } catch (error) {
    console.error('Error in database analysis:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
