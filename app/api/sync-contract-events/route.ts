import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPublicClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"

const UNILABOOK_ABI = parseAbi([
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, uint256 totalAmount, uint256 platformFee)",
  "event TicketMinted(uint256 indexed tokenId, uint256 indexed orderId, address indexed owner)",
  "event PaymentProcessed(uint256 indexed orderId, address indexed vendor, uint256 amount)",
])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { fromBlock: requestedFromBlock, toBlock: requestedToBlock, orderId: specificOrderId, cartItems } = body
    
    // Get contract address - use hardcoded address from addresses.ts
    const contractAddress = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08" as `0x${string}`

    // Create public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org")
    })

    // Use provided block range or default to recent blocks
    const toBlock = requestedToBlock ? BigInt(requestedToBlock) : await publicClient.getBlockNumber()
    const fromBlock = requestedFromBlock ? BigInt(requestedFromBlock) : toBlock - 1000n

    console.log(`Processing blocks ${fromBlock} to ${toBlock}`)

    let processedCount = 0

    try {
      // Get OrderCreated events
      const orderCreatedLogs = await publicClient.getLogs({
        address: contractAddress,
        event: UNILABOOK_ABI[0], // OrderCreated event
        fromBlock,
        toBlock,
      })

      console.log(`Found ${orderCreatedLogs.length} OrderCreated events`)

      // Process OrderCreated events
      for (const log of orderCreatedLogs) {
        const { orderId, buyer, totalAmount, platformFee } = log.args as any
        
        console.log(`Processing OrderCreated: ${orderId} by ${buyer}`)
        
        // Check if order already exists in database
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("transaction_hash", `contract_${orderId}`)
          .single()

        if (!existingOrder) {
          // Create order in database
          const { error: orderError } = await supabase
            .from("orders")
            .insert({
              id: crypto.randomUUID(), // Generate new UUID
              user_id: await getUserIdFromWallet(supabase, buyer),
              total_amount: Number(totalAmount) / 1e18, // Convert from wei
              platform_fee_total: Number(platformFee) / 1e18,
              wallet_address: buyer,
              transaction_hash: `contract_${orderId}`,
              status: "confirmed",
              nft_batch_contract_address: contractAddress,
              nft_batch_id: orderId.toString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (orderError) {
            console.error(`Failed to create order ${orderId}:`, orderError)
          } else {
            processedCount++
            
            // If we have cart items, create bookings for this order
            if (cartItems && cartItems.length > 0) {
              console.log(`Creating ${cartItems.length} bookings for order ${orderId}`)
              
              // Get the database order ID
              const { data: dbOrder } = await supabase
                .from("orders")
                .select("id")
                .eq("transaction_hash", `contract_${orderId}`)
                .single()
              
              if (dbOrder) {
                // Create bookings from cart items
                for (const cartItem of cartItems) {
                  const { error: bookingError } = await supabase
                    .from("bookings")
                    .insert({
                      id: crypto.randomUUID(),
                      order_id: dbOrder.id, // Link booking to order
                      user_id: await getUserIdFromWallet(supabase, buyer),
                      listing_id: cartItem.listing.id,
                      vendor_id: cartItem.listing.vendor_id,
                      booking_date: cartItem.booking_date,
                      quantity: cartItem.quantity,
                      subtotal: cartItem.listing.price * cartItem.quantity,
                      platform_fee: (cartItem.listing.price * cartItem.quantity) * 0.005, // 0.5%
                      total_amount: (cartItem.listing.price * cartItem.quantity) * 1.005,
                      status: "confirmed",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                  
                  if (bookingError) {
                    console.error(`Failed to create booking for order ${orderId}:`, bookingError)
                  } else {
                    // Create order_item linking
                    const { data: booking } = await supabase
                      .from("bookings")
                      .select("id")
                      .eq("user_id", await getUserIdFromWallet(supabase, buyer))
                      .eq("listing_id", cartItem.listing.id)
                      .eq("booking_date", cartItem.booking_date)
                      .order("created_at", { ascending: false })
                      .limit(1)
                      .single()
                    
                    if (booking) {
                      const { error: orderItemError } = await supabase
                        .from("order_items")
                        .insert({
                          order_id: dbOrder.id,
                          booking_id: booking.id
                        })
                      
                      if (orderItemError) {
                        console.error(`Failed to create order_item for order ${orderId}:`, orderItemError)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Get TicketMinted events
      const ticketMintedLogs = await publicClient.getLogs({
        address: contractAddress,
        event: UNILABOOK_ABI[1], // TicketMinted event
        fromBlock,
        toBlock,
      })

      console.log(`Found ${ticketMintedLogs.length} TicketMinted events`)

      // Process TicketMinted events
      for (const log of ticketMintedLogs) {
        const { tokenId, orderId, owner } = log.args as any
        
        console.log(`Processing TicketMinted: token ${tokenId} for order ${orderId}`)
        
        // Find the order in database
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("transaction_hash", `contract_${orderId}`)
          .single()

        if (order) {
          // Find bookings for this order
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("booking_id")
            .eq("order_id", order.id)

          if (orderItems && orderItems.length > 0) {
            // Update the first pending booking with NFT data
            const { error: bookingError } = await supabase
              .from("bookings")
              .update({
                nft_contract_address: contractAddress,
                nft_token_id: tokenId.toString(),
                status: "confirmed",
                updated_at: new Date().toISOString()
              })
              .eq("id", orderItems[0].booking_id)
              .eq("status", "pending")

            if (bookingError) {
              console.error(`Failed to update booking for token ${tokenId}:`, bookingError)
            } else {
              processedCount++
            }
          }
        }
      }

    } catch (logError) {
      console.error('Error fetching logs:', logError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch contract logs: ${logError.message}`,
        processed: 0
      })
    }

    // If we processed a specific order, return the database order ID
    let databaseOrderId = null
    if (specificOrderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("transaction_hash", `contract_${specificOrderId}`)
        .single()
      
      if (order) {
        databaseOrderId = order.id
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} events from blocks ${fromBlock} to ${toBlock}`,
      processed: processedCount,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      databaseOrderId
    })
    
  } catch (error) {
    console.error('Error in contract sync:', error)
    return NextResponse.json({ 
      success: false,
      error: `Internal server error: ${error.message}`,
      processed: 0
    })
  }
}

async function getUserIdFromWallet(supabase: any, walletAddress: string): Promise<string | null> {
  // Try to find user by wallet address
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .single()

  return profile?.id || null
}
