import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    
    // Validate order ID format
    if (!orderId || typeof orderId !== 'string') {
      console.error('[Verify API] Invalid order ID:', orderId)
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      )
    }

    console.log('[Verify API] Verifying order:', orderId)
    
    // Use regular client - RLS policies now allow public ticket verification
    const supabase = await createClient()

    // Fetch order details
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq("id", orderId)
      .single()

    if (orderError) {
      console.error('[Verify API] Error fetching order:', orderError)
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    if (!orderData) {
      console.error('[Verify API] Order not found:', orderId)
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    console.log('[Verify API] Order found, status:', orderData.status)

    // Only show confirmed orders
    if (orderData.status !== "confirmed") {
      return NextResponse.json(
        { error: "Order not confirmed" },
        { status: 400 }
      )
    }

    // Fetch order items and bookings
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("booking_id")
      .eq("order_id", orderId)

    if (orderItemsError) {
      console.error('[Verify API] Error fetching order items:', orderItemsError)
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      )
    }

    if (!orderItems || orderItems.length === 0) {
      console.error('[Verify API] No order items found for order:', orderId)
      return NextResponse.json(
        { error: "Order has no items" },
        { status: 400 }
      )
    }

    const bookingIds = orderItems.map(item => item.booking_id)
    console.log('[Verify API] Found order items:', orderItems.length, 'Booking IDs:', bookingIds)

    // Fetch bookings with listing and vendor details
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        listing:listings (
          *,
          vendor:vendors (
            business_name,
            contact_email,
            phone,
            location
          )
        )
      `)
      .in("id", bookingIds)
      
    console.log('[Verify API] Raw bookings count:', bookings?.length)
    
    // Check authentication and access control
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: "Order has no bookings" },
        { status: 404 }
      )
    }
    
    let filteredBookings: typeof bookings = []
    let accessDenied = false
    let accessReason = ""
    
    if (user) {
      // Check if user is a vendor
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .single()
        
      if (vendor) {
        // User is a vendor - only show their bookings
        filteredBookings = bookings.filter(booking => booking.vendor_id === vendor.id)
        
        if (!filteredBookings || filteredBookings.length === 0) {
          accessDenied = true
          accessReason = "Services not included in this booking"
        } else {
          console.log('[Verify API] Vendor - filtered to their bookings:', filteredBookings.length)
        }
      } else {
        // User is regular customer - check if they own the order
        const ownsOrder = orderData.user_id === user.id
        
        // Check if they own any of the bookings
        const ownsBookings = bookings.some(booking => booking.user_id === user.id)
        
        if (ownsOrder || ownsBookings) {
          // User owns this booking - show all bookings
          filteredBookings = bookings
          console.log('[Verify API] Customer - owns this order')
        } else {
          accessDenied = true
          accessReason = "This code does not belong to you"
        }
      }
    } else {
      // Unauthenticated user - no access
      accessDenied = true
      accessReason = "Authentication required"
    }
    
    if (accessDenied) {
      console.log('[Verify API] Access denied:', accessReason)
      return NextResponse.json(
        { error: accessReason },
        { status: 403 }
      )
    }

    if (bookingsError) {
      console.error('[Verify API] Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      )
    }

    console.log('[Verify API] Found bookings:', filteredBookings?.length || 0)

    // Check if this is a gift order
    const hasGiftBookings = filteredBookings?.some(booking => booking.is_gift)
    const hasRecipientInfo = filteredBookings?.some(booking => 
      booking.recipient_name || booking.recipient_email
    )
    
    // Determine customer information
    let customerInfo = {
      name: orderData.profiles?.full_name || "N/A",
      email: orderData.profiles?.email || "N/A"
    }
    
    let buyerInfo = null
    
    if (hasGiftBookings || hasRecipientInfo) {
      // For gift orders, use recipient information as primary customer
      const giftBooking = filteredBookings?.find(booking => 
        booking.is_gift || (booking.recipient_name || booking.recipient_email)
      )
      
      if (giftBooking) {
        customerInfo = {
          name: giftBooking.recipient_name || "N/A",
          email: giftBooking.recipient_email || "N/A"
        }
        
        // Set buyer information
        buyerInfo = {
          name: orderData.profiles?.full_name || "N/A",
          email: orderData.profiles?.email || "N/A"
        }
      }
    }

    // Format the response with all necessary details
    const ticketData = {
      orderId: orderData.id,
      status: orderData.status,
      totalAmount: orderData.total_amount,
      platformFee: orderData.platform_fee_total,
      transactionHash: orderData.transaction_hash,
      walletAddress: orderData.wallet_address,
      createdAt: orderData.created_at,
      customer: customerInfo,
      buyer: buyerInfo,
      bookings: (filteredBookings || []).map(booking => ({
        id: booking.id,
        serviceTitle: booking.listing?.title,
        serviceType: booking.listing?.service_type,
        quantity: booking.quantity,
        totalAmount: booking.total_amount,
        bookingDate: booking.booking_date,
        vendor: {
          businessName: booking.listing?.vendor?.business_name,
          contactEmail: booking.listing?.vendor?.contact_email,
          phone: booking.listing?.vendor?.phone,
          location: booking.listing?.vendor?.location
        },
        listing: {
          description: booking.listing?.description,
          price: booking.listing?.price,
          location: booking.listing?.location,
          images: booking.listing?.images || []
        },
        nft: {
          contractAddress: booking.nft_contract_address,
          tokenId: booking.nft_token_id
        }
      }))
    }

    console.log('[Verify API] Successfully verified order:', orderId)
    return NextResponse.json(ticketData)
  } catch (error) {
    console.error('[Verify API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
