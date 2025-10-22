import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPublicClient, http, parseAbi } from "viem"
import { baseSepolia } from "viem/chains"

const UNILABOOK_ABI = parseAbi([
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, uint256 totalAmount, uint256 platformFee)",
  "event TicketMinted(uint256 indexed tokenId, uint256 indexed orderId, address indexed owner)",
])

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get contract address - use hardcoded address from addresses.ts
    const contractAddress = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08" as `0x${string}`

    // Create public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org")
    })

    // Get the last processed block from database
    const { data: lastProcessed } = await supabase
      .from("sync_status")
      .select("last_block")
      .eq("contract_address", contractAddress)
      .single()

    const fromBlock = lastProcessed?.last_block ? BigInt(lastProcessed.last_block) + 1n : 0n
    const toBlock = await publicClient.getBlockNumber()

    if (fromBlock > toBlock) {
      return NextResponse.json({ 
        success: true, 
        message: "No new blocks to process",
        processed: 0
      })
    }

    console.log(`[CRON] Processing blocks ${fromBlock} to ${toBlock}`)

    // Get OrderCreated events
    const orderCreatedLogs = await publicClient.getLogs({
      address: contractAddress,
      event: UNILABOOK_ABI[0], // OrderCreated event
      fromBlock,
      toBlock,
    })

    // Get TicketMinted events
    const ticketMintedLogs = await publicClient.getLogs({
      address: contractAddress,
      event: UNILABOOK_ABI[1], // TicketMinted event
      fromBlock,
      toBlock,
    })

    let processedCount = 0

    // Process OrderCreated events
    for (const log of orderCreatedLogs) {
      const { orderId, buyer, totalAmount, platformFee } = log.args as any
      
      console.log(`[CRON] Processing OrderCreated: ${orderId} by ${buyer}`)
      
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
          console.error(`[CRON] Failed to create order ${orderId}:`, orderError)
        } else {
          processedCount++
        }
      }
    }

    // Process TicketMinted events
    for (const log of ticketMintedLogs) {
      const { tokenId, orderId, owner } = log.args as any
      
      console.log(`[CRON] Processing TicketMinted: token ${tokenId} for order ${orderId}`)
      
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
            console.error(`[CRON] Failed to update booking for token ${tokenId}:`, bookingError)
          } else {
            processedCount++
          }
        }
      }
    }

    // Update last processed block
    await supabase
      .from("sync_status")
      .upsert({
        contract_address: contractAddress,
        last_block: toBlock.toString(),
        updated_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true, 
      message: `[CRON] Processed ${processedCount} events from blocks ${fromBlock} to ${toBlock}`,
      processed: processedCount,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString()
    })
    
  } catch (error) {
    console.error('[CRON] Error in contract sync:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
