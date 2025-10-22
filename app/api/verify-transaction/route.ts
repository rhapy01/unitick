import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transactionHash, orderId } = await request.json()

    if (!transactionHash || !orderId) {
      return NextResponse.json({ 
        error: "Transaction hash and order ID are required" 
      }, { status: 400 })
    }

    console.log('🔍 Verifying transaction status:', { transactionHash, orderId })

    // Check transaction status on blockchain
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'
    const formattedTxHash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`
    
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [formattedTxHash],
        id: 1
      })
    })

    if (!receiptResponse.ok) {
      return NextResponse.json({ 
        error: "Failed to fetch transaction receipt",
        details: `RPC returned ${receiptResponse.status}`
      }, { status: 500 })
    }

    const receiptData = await receiptResponse.json()
    
    if (receiptData.error || !receiptData.result) {
      return NextResponse.json({ 
        error: "Transaction not found or invalid",
        details: receiptData.error?.message
      }, { status: 400 })
    }

    const receipt = receiptData.result
    const isSuccessful = receipt.status === '0x1'
    
    console.log('📋 Transaction receipt status:', { 
      status: receipt.status, 
      isSuccessful,
      gasUsed: receipt.gasUsed,
      blockNumber: receipt.blockNumber
    })

    // Update order status based on transaction result
    if (isSuccessful) {
      // Transaction was successful - confirm the order
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
        return NextResponse.json({ 
          error: "Failed to update order status",
          details: updateError.message
        }, { status: 500 })
      }

      // Also update related bookings
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', await getBookingIdsForOrder(supabase, orderId))

      if (bookingUpdateError) {
        console.error('Failed to update booking status:', bookingUpdateError)
        // Don't fail the request if booking update fails
      }

      return NextResponse.json({ 
        success: true,
        message: "Transaction verified as successful - order confirmed",
        transactionStatus: "success",
        orderStatus: "confirmed"
      })
    } else {
      // Transaction failed - mark order as failed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
        return NextResponse.json({ 
          error: "Failed to update order status",
          details: updateError.message
        }, { status: 500 })
      }

      // Also update related bookings
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', await getBookingIdsForOrder(supabase, orderId))

      if (bookingUpdateError) {
        console.error('Failed to update booking status:', bookingUpdateError)
        // Don't fail the request if booking update fails
      }

      return NextResponse.json({ 
        success: true,
        message: "Transaction verified as failed - order marked as failed",
        transactionStatus: "failed",
        orderStatus: "failed",
        details: {
          gasUsed: receipt.gasUsed,
          blockNumber: receipt.blockNumber,
          status: receipt.status
        }
      })
    }

  } catch (error) {
    console.error('Error verifying transaction:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getBookingIdsForOrder(supabase: any, orderId: string): Promise<string[]> {
  try {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('booking_id')
      .eq('order_id', orderId)

    return orderItems?.map((item: any) => item.booking_id) || []
  } catch (error) {
    console.error('Error fetching booking IDs:', error)
    return []
  }
}
