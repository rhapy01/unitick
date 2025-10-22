import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

// Contract configuration
const CONTRACT_ADDRESS = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
const RPC_URL = "https://sepolia.base.org"

serve(async (req) => {
  try {
    console.log('🔄 Starting blockchain sync...')
    
    // Get the last processed block from database
    const { data: lastProcessed } = await supabase
      .from("sync_status")
      .select("last_block")
      .eq("contract_address", CONTRACT_ADDRESS)
      .single()

    const fromBlock = lastProcessed?.last_block ? BigInt(lastProcessed.last_block) + 1n : 0n
    
    // Get current block number
    const currentBlockResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    
    const currentBlockData = await currentBlockResponse.json()
    const toBlock = BigInt(currentBlockData.result)

    if (fromBlock > toBlock) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No new blocks to process",
        processed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`Processing blocks ${fromBlock} to ${toBlock}`)

    // Get OrderCreated events
    const orderCreatedLogs = await getContractLogs(CONTRACT_ADDRESS, fromBlock, toBlock, "OrderCreated")
    console.log(`Found ${orderCreatedLogs.length} OrderCreated events`)

    // Get TicketMinted events  
    const ticketMintedLogs = await getContractLogs(CONTRACT_ADDRESS, fromBlock, toBlock, "TicketMinted")
    console.log(`Found ${ticketMintedLogs.length} TicketMinted events`)

    let processedCount = 0

    // Process OrderCreated events
    for (const log of orderCreatedLogs) {
      const orderId = BigInt(log.topics[1])
      const buyer = '0x' + log.topics[2].slice(26)
      const totalAmount = BigInt(log.data.slice(0, 66))
      const platformFee = BigInt('0x' + log.data.slice(66, 130))
      
      console.log(`Processing OrderCreated: ${orderId} by ${buyer}`)
      
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("transaction_hash", `contract_${orderId}`)
        .single()

      if (!existingOrder) {
        // Find user by wallet address
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("wallet_address", buyer)
          .single()

        if (profile) {
          // Create order in database
          const { error: orderError } = await supabase
            .from("orders")
            .insert({
              id: crypto.randomUUID(),
              user_id: profile.id,
              total_amount: Number(totalAmount) / 1e18,
              platform_fee_total: Number(platformFee) / 1e18,
              wallet_address: buyer,
              transaction_hash: `contract_${orderId}`,
              status: "confirmed",
              nft_batch_contract_address: CONTRACT_ADDRESS,
              nft_batch_id: orderId.toString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (orderError) {
            console.error(`Failed to create order ${orderId}:`, orderError)
          } else {
            processedCount++
            console.log(`✅ Created order ${orderId}`)
          }
        } else {
          console.log(`⚠️ No profile found for wallet ${buyer}`)
        }
      }
    }

    // Process TicketMinted events
    for (const log of ticketMintedLogs) {
      const tokenId = BigInt(log.topics[1])
      const orderId = BigInt(log.topics[2])
      const owner = '0x' + log.topics[3].slice(26)
      
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
              nft_contract_address: CONTRACT_ADDRESS,
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
            console.log(`✅ Updated booking with token ${tokenId}`)
          }
        }
      }
    }

    // Update last processed block
    await supabase
      .from("sync_status")
      .upsert({
        contract_address: CONTRACT_ADDRESS,
        last_block: toBlock.toString(),
        updated_at: new Date().toISOString()
      })

    console.log(`✅ Sync complete: processed ${processedCount} events`)

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${processedCount} events from blocks ${fromBlock} to ${toBlock}`,
      processed: processedCount,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
    
  } catch (error) {
    console.error('❌ Sync error:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: `Sync failed: ${error.message}`,
      processed: 0
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

async function getContractLogs(contractAddress: string, fromBlock: bigint, toBlock: bigint, eventName: string) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [{
        address: contractAddress,
        fromBlock: '0x' + fromBlock.toString(16),
        toBlock: '0x' + toBlock.toString(16),
        topics: getEventTopics(eventName)
      }],
      id: 1
    })
  })
  
  const data = await response.json()
  return data.result || []
}

function getEventTopics(eventName: string): string[] {
  const eventSignatures = {
    'OrderCreated': '0x' + 'OrderCreated(uint256,address,uint256,uint256)'.split('').map(c => c.charCodeAt(0).toString(16)).join(''),
    'TicketMinted': '0x' + 'TicketMinted(uint256,uint256,address)'.split('').map(c => c.charCodeAt(0).toString(16)).join('')
  }
  
  return [eventSignatures[eventName]]
}
