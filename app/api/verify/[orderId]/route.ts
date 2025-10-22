import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId
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

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

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
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      )
    }

    const bookingIds = orderItems.map(item => item.booking_id)

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

    if (bookingsError) {
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      )
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
      customer: {
        name: orderData.profiles?.full_name || "N/A",
        email: orderData.profiles?.email || "N/A"
      },
      bookings: (bookings || []).map(booking => ({
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

    return NextResponse.json(ticketData)
  } catch (error) {
    console.error("Verification API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
