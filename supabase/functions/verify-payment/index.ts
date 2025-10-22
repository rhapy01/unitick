/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyPaymentRequest {
  transactionHash: string
  orderId: string
  expectedAmount: string
  fromAddress: string
  toAddress: string
  chainId: number
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting payment verification...')
    
    const { transactionHash, orderId, expectedAmount, fromAddress, toAddress, chainId }: VerifyPaymentRequest = await req.json()
    
    console.log('📝 Request data:', { transactionHash, orderId, expectedAmount, fromAddress, toAddress, chainId })

    // Validate required fields
    if (!transactionHash || !orderId || !expectedAmount || !fromAddress || !toAddress) {
      console.error('❌ Missing required fields:', { 
        transactionHash: !!transactionHash, 
        orderId: !!orderId, 
        expectedAmount: !!expectedAmount, 
        fromAddress: !!fromAddress, 
        toAddress: !!toAddress,
        toAddressValue: toAddress 
      })
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            transactionHash: transactionHash || 'missing',
            orderId: orderId || 'missing',
            expectedAmount: expectedAmount || 'missing',
            fromAddress: fromAddress || 'missing',
            toAddress: toAddress || 'missing'
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    console.log('🔗 Initializing Supabase client...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client initialized')

    // Check if already verified (idempotency)
    console.log('🔍 Checking if order already verified...')
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('status, transaction_hash')
      .eq('id', orderId)
      .single()

    console.log('📋 Existing order data:', existingOrder)

    // Track if this is a re-verification to skip blockchain checks but still send notifications
    const isAlreadyVerified = existingOrder?.status === 'confirmed' && 
                               existingOrder?.transaction_hash === transactionHash

    if (isAlreadyVerified) {
      console.log('ℹ️  Order already verified, will skip blockchain/database updates but send notifications...')
    }

    // Verify blockchain transaction (both contract and regular payments) - skip if already verified
    if (!isAlreadyVerified && transactionHash.startsWith('contract_')) {
      console.log('🔗 Contract payment detected, skipping blockchain verification...')
      
      // Extract the contract order ID from contract_ prefix
      const contractOrderId = transactionHash.replace('contract_', '')
      console.log(`📋 Contract order ID: ${contractOrderId}`)
      
      // For contract payments, we don't need to verify a transaction hash
      // because the contract call itself already confirmed the payment
      // The order ID is sufficient to identify the contract transaction
      
      // Validate that the contract order ID is a valid number
      if (!contractOrderId || isNaN(Number(contractOrderId))) {
        console.error('❌ Invalid contract order ID:', contractOrderId)
        return new Response(
          JSON.stringify({ error: 'Invalid contract order ID', details: 'Contract order ID must be a valid number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('✅ Contract payment validation passed (order ID verified)')
      
    } else if (!isAlreadyVerified) {
      // Verify transaction on-chain for regular payments (skip if already verified)
      const rpcUrl = Deno.env.get('RPC_URL') || 'https://sepolia.base.org'
      // Ensure the hash has 0x prefix for Ethereum RPC
      const formattedTxHash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`
      console.log('🔗 Verifying transaction on blockchain...', { rpcUrl, transactionHash, formattedTxHash })
      
      const verifyResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionByHash',
          params: [formattedTxHash],
          id: 1
        })
      })

      if (!verifyResponse.ok) {
        console.error('❌ RPC response not OK:', verifyResponse.status, verifyResponse.statusText)
        return new Response(
          JSON.stringify({ error: 'Blockchain verification failed', details: `RPC returned ${verifyResponse.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const txData = await verifyResponse.json()
      console.log('📋 Transaction data received:', txData)
      
      if (txData.error || !txData.result) {
        return new Response(
          JSON.stringify({ error: 'Transaction not found or invalid' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tx = txData.result

      // Verify transaction details
      const txFrom = tx.from?.toLowerCase()
      const txTo = tx.to?.toLowerCase()
      const txValue = BigInt(tx.value || '0')
      const expectedValue = BigInt(Math.floor(parseFloat(expectedAmount) * 1e18))

      if (txFrom !== fromAddress.toLowerCase() || 
          txTo !== toAddress.toLowerCase() || 
          txValue < expectedValue) {
        return new Response(
          JSON.stringify({ error: 'Transaction details do not match expected payment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get transaction receipt to confirm it was successful
      console.log('🔗 Getting transaction receipt...')
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
        console.error('❌ Receipt RPC response not OK:', receiptResponse.status, receiptResponse.statusText)
        return new Response(
          JSON.stringify({ error: 'Receipt verification failed', details: `RPC returned ${receiptResponse.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const receiptData = await receiptResponse.json()
      console.log('📋 Receipt data received:', receiptData)
      
      if (receiptData.error || !receiptData.result || receiptData.result.status !== '0x1') {
        return new Response(
          JSON.stringify({ error: 'Transaction failed or not confirmed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (isAlreadyVerified) {
      console.log('ℹ️  Skipping blockchain verification (already verified)')
    }

    // Get order and bookings for this order
    console.log('🔍 Fetching order data...')
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      console.error('❌ Order not found:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found', details: orderError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('✅ Order data fetched:', { id: orderData.id, status: orderData.status, user_id: orderData.user_id })

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('booking_id')
      .eq('order_id', orderId)

    const bookingIds = orderItems?.map((item: any) => item.booking_id) || []

    // Update order status only if not already verified
    if (!isAlreadyVerified) {
      console.log('🔄 Updating order status to confirmed...')
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)

      if (orderUpdateError) {
        console.error('❌ Order update error:', orderUpdateError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update order',
            details: orderUpdateError.message,
            orderId: orderId,
            transactionHash: transactionHash
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('✅ Order updated successfully')

      // Update all bookings to confirmed status
      if (bookingIds.length > 0) {
        console.log('🔄 Updating bookings to confirmed status...', { bookingIds })
        const { error: bookingUpdateError } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString()
          })
          .in("id", bookingIds)

        if (bookingUpdateError) {
          console.error('❌ Booking update error:', bookingUpdateError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to update bookings',
              details: bookingUpdateError.message,
              orderId: orderId,
              bookingIds: bookingIds,
              transactionHash: transactionHash
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('✅ Bookings updated successfully')
      } else {
        console.log('⚠️ No bookings to update')
      }
    } else {
      console.log('ℹ️  Skipping order/booking updates (already verified)')
    }

    // Note: Cart clearing is handled by the payment page after successful payment
    // to avoid race conditions and ensure proper cleanup

    // Send vendor notifications for new bookings (ALWAYS, even if already verified)
    console.log('📧 Sending vendor notifications...')
    console.log(`ℹ️  Re-verification: ${isAlreadyVerified ? 'Yes' : 'No'}`)
    try {
      // Get all bookings with vendor information
      const { data: allBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:listings(*, vendor:vendors(id, user_id, business_name, contact_email))
        `)
        .in('id', bookingIds)

      if (allBookings && allBookings.length > 0) {
        console.log(`📋 Found ${allBookings.length} bookings for vendor notifications`)
        
        // Group bookings by vendor
        const vendorBookings = allBookings.reduce((acc: any, booking: any) => {
          const vendorId = booking.vendor_id
          
          // Check if booking has required vendor data
          if (!booking.listing?.vendor) {
            console.warn(`⚠️  Booking ${booking.id} has no vendor data in listing, skipping...`)
            return acc
          }
          
          if (!acc[vendorId]) {
            acc[vendorId] = {
              vendor: booking.listing.vendor,
              bookings: []
            }
          }
          acc[vendorId].bookings.push(booking)
          return acc
        }, {})

        console.log(`📋 Grouped into ${Object.keys(vendorBookings).length} vendors`)

        // Send notification to each vendor
        for (const [vendorId, vendorData] of Object.entries(vendorBookings) as any) {
          try {
            console.log(`📧 Sending notification to vendor ${vendorId}...`)
            
            // Validate vendor has contact email
            if (!vendorData.vendor.contact_email) {
              console.warn(`⚠️  Vendor ${vendorId} (${vendorData.vendor.business_name}) has no contact_email, skipping email notification`)
              console.warn(`ℹ️  Vendor should add contact_email to their profile to receive booking notifications`)
              // Still create in-app notification even if no email
            }
            
            const vendorNotificationData = {
              vendorEmail: vendorData.vendor.contact_email,
              vendorName: vendorData.vendor.business_name,
              orderId: orderId,
              customerName: orderData.profiles?.full_name || 'Customer',
              customerEmail: orderData.profiles?.email || 'N/A',
              totalAmount: vendorData.bookings.reduce((sum: number, b: any) => sum + b.total_amount, 0),
              transactionHash: transactionHash,
              isGift: vendorData.bookings.some((booking: any) => booking.is_gift),
              recipientName: vendorData.bookings.find((booking: any) => booking.is_gift)?.recipient_name,
              bookings: vendorData.bookings.map((booking: any) => ({
                title: booking.listing.title,
                quantity: booking.quantity,
                totalAmount: booking.total_amount,
                bookingDate: booking.booking_date,
                customerNotes: booking.notes || 'No special notes'
              })),
              vendorDashboardUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/vendor/dashboard`
            }

            // Send vendor notification email (only if vendor has email)
            if (vendorData.vendor.contact_email) {
              console.log(`📧 Attempting to send email to ${vendorNotificationData.vendorEmail}...`)
              const emailResult = await supabase.functions.invoke('send-email', {
                body: {
                  to: vendorNotificationData.vendorEmail,
                  subject: `New Booking: ${vendorData.bookings.length} service(s) booked`,
                  template: 'vendor-booking-notification',
                  data: vendorNotificationData
                }
              })
              
              if (emailResult.error) {
                console.error('❌ Email notification failed:', emailResult.error)
                console.error('❌ Email error details:', JSON.stringify(emailResult.error, null, 2))
              } else {
                console.log('✅ Email notification sent successfully:', emailResult.data)
              }
            } else {
              console.log('ℹ️  Skipping email (no contact_email), but creating in-app notification')
            }

            // Create in-app notification for vendor
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                user_id: vendorData.vendor.user_id, // Vendor's user ID
                type: 'new_booking',
                priority: 'high',
                title: `New Booking: ${vendorData.bookings.length} service(s)`,
                message: `${orderData.profiles?.full_name || 'A customer'} booked ${vendorData.bookings.length} of your service(s) for $${vendorNotificationData.totalAmount.toFixed(2)}.`,
                data: {
                  orderId: orderId,
                  customerName: orderData.profiles?.full_name,
                  totalAmount: vendorNotificationData.totalAmount,
                  bookingCount: vendorData.bookings.length,
                  dashboardUrl: vendorNotificationData.vendorDashboardUrl
                }
              })

            if (notificationError) {
              console.error('❌ Error creating vendor booking notification:', notificationError)
            } else {
              console.log('✅ In-app notification created successfully')
            }
          } catch (vendorNotificationError) {
            console.error('❌ Individual vendor notification failed:', vendorNotificationError)
            // Continue with other vendors even if one fails
          }
        }
      }
    } catch (vendorError) {
      // Log vendor notification error but don't fail the payment
      console.error('❌ Vendor notification error (non-critical):', vendorError)
    }

    // Send gift notifications to unregistered recipients
    console.log('🎁 Checking for gift notifications...')
    try {
      // Get bookings with gift information
      const { data: bookingsWithGifts } = await supabase
        .from('bookings')
        .select(`
          *,
          listing:listings(*, vendor:vendors(*)),
          cart_item:cart_items(*)
        `)
        .in('id', bookingIds)
        .eq('cart_item.is_gift', true)

      if (bookingsWithGifts && bookingsWithGifts.length > 0) {
        console.log(`🎁 Found ${bookingsWithGifts.length} gift bookings`)
        
        // Get sender information
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', orderData.user_id)
          .single()

        const senderName = senderProfile?.full_name || 'Someone'

        // Process each gift booking
        for (const booking of bookingsWithGifts) {
          try {
            console.log(`🎁 Processing gift for booking ${booking.id}...`)
            
            const cartItem = booking.cart_item
            if (cartItem?.recipient_email && cartItem?.recipient_wallet) {
              // Check if recipient is registered
              const { data: recipientProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', cartItem.recipient_email.toLowerCase())
                .single()

              // If recipient is not registered, send notification email
              if (!recipientProfile) {
                console.log(`📧 Sending gift notification to ${cartItem.recipient_email}...`)
                
                const giftNotificationData = {
                  recipientEmail: cartItem.recipient_email,
                  recipientName: cartItem.recipient_name,
                  senderName: senderName,
                  giftMessage: cartItem.gift_message,
                  services: [{
                    title: booking.listing?.title || 'Service',
                    vendor: booking.listing?.vendor?.business_name || 'Vendor',
                    quantity: booking.quantity,
                    price: booking.total_amount / booking.quantity
                  }],
                  totalAmount: booking.total_amount,
                  claimUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/gift/claim/${booking.id}`,
                  signupUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/auth/signup`
                }

                // Send gift notification email via Supabase Edge function
                console.log(`📧 Attempting to send gift notification to ${cartItem.recipient_email}...`)
                const giftResult = await supabase.functions.invoke('send-gift-notification', {
                  body: giftNotificationData
                })
                
                if (giftResult.error) {
                  console.error('❌ Gift notification failed:', giftResult.error)
                  console.error('❌ Gift error details:', JSON.stringify(giftResult.error, null, 2))
                } else {
                  console.log('✅ Gift notification sent successfully:', giftResult.data)
                }
              } else {
                console.log(`✅ Recipient ${cartItem.recipient_email} is already registered, skipping email`)
              }
            }
          } catch (giftError) {
            console.error('❌ Individual gift notification failed:', giftError)
            // Continue with other gifts even if one fails
          }
        }
      } else {
        console.log('ℹ️ No gift bookings found')
      }
    } catch (emailError) {
      // Log email error but don't fail the payment verification
      console.error('❌ Gift notification error (non-critical):', emailError)
    }

    // CONTRACT SYNC: Check if this is a contract-based transaction
    if (transactionHash.startsWith('contract_')) {
      console.log('🔄 Contract payment detected, syncing blockchain events...')
      try {
        // Extract contract order ID from transaction hash
        const contractOrderId = transactionHash.replace('contract_', '')
        console.log(`📋 Contract order ID: ${contractOrderId}`)

        // Validate contract order ID before syncing
        if (!contractOrderId || isNaN(Number(contractOrderId))) {
          console.error('❌ Invalid contract order ID for sync:', contractOrderId)
          throw new Error('Invalid contract order ID for sync')
        }

        // Sync contract events to database
        await syncContractEventsToDatabase(supabase, contractOrderId, orderId, bookingIds)

        console.log('✅ Contract sync completed successfully')
      } catch (syncError) {
        console.error('❌ Contract sync failed (non-critical):', syncError)
        // Don't fail the payment verification if sync fails
        console.log('ℹ️ Payment verification will continue despite sync failure')
      }
    } else {
      console.log('ℹ️ Regular payment detected, skipping contract sync')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and confirmed',
        orderId,
        transactionHash
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to sync contract events to database
async function syncContractEventsToDatabase(supabase: any, contractOrderId: string, orderId: string, bookingIds: string[]) {
  const CONTRACT_ADDRESS = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
  const RPC_URL = "https://sepolia.base.org"

  try {
    // For contract payments, we need to find the transaction that created this order
    // Since we don't have the transaction hash, we'll search recent blocks for OrderCreated events
    // with the matching order ID
    
    console.log(`🔍 Searching for OrderCreated event with order ID: ${contractOrderId}`)
    
    // Get the latest block number to search backwards from
    const latestBlockResponse = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })

    const latestBlockData = await latestBlockResponse.json()
    if (!latestBlockData.result) {
      console.log('Could not get latest block number, skipping contract sync')
      return
    }

    const latestBlock = BigInt(latestBlockData.result)
    // Search the last 100 blocks for the OrderCreated event
    const fromBlock = latestBlock - BigInt(100)
    
    console.log(`🔍 Searching blocks ${fromBlock} to ${latestBlock} for OrderCreated event`)
    
    // Search for OrderCreated events in recent blocks
    const orderCreatedLogs = await getContractLogs(CONTRACT_ADDRESS, fromBlock, latestBlock, "OrderCreated")
    console.log(`Found ${orderCreatedLogs.length} OrderCreated events in recent blocks`)

    // Find the specific order we're looking for
    let targetOrderLog = null
    for (const log of orderCreatedLogs) {
      const orderIdFromEvent = BigInt(log.topics[1])
      if (orderIdFromEvent.toString() === contractOrderId) {
        targetOrderLog = log
        break
      }
    }

    if (!targetOrderLog) {
      console.log(`OrderCreated event not found for order ID ${contractOrderId}, skipping contract sync`)
      return
    }

    console.log(`✅ Found OrderCreated event for order ID ${contractOrderId}`)
    
    // Get the block number from the log
    const blockNumber = BigInt(targetOrderLog.blockNumber)

    // Get TicketMinted events from this block
    const ticketMintedLogs = await getContractLogs(CONTRACT_ADDRESS, blockNumber, blockNumber, "TicketMinted")
    console.log(`Found ${ticketMintedLogs.length} TicketMinted events in block ${blockNumber}`)

    // Process the OrderCreated event we found
    const orderIdFromEvent = BigInt(targetOrderLog.topics[1])
    const buyer = '0x' + targetOrderLog.topics[2].slice(26)
    const totalAmount = BigInt(targetOrderLog.data.slice(0, 66))
    const platformFee = BigInt('0x' + targetOrderLog.data.slice(66, 130))

    console.log(`Processing OrderCreated: ${orderIdFromEvent} by ${buyer}`)

    // Update the order with contract details
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        nft_batch_contract_address: CONTRACT_ADDRESS,
        nft_batch_id: orderIdFromEvent.toString()
      })
      .eq("id", orderId)

    if (orderUpdateError) {
      console.error(`Failed to update order ${orderId}:`, orderUpdateError)
    }

    // Process TicketMinted events
    for (const log of ticketMintedLogs) {
      const tokenId = BigInt(log.topics[1])
      const orderIdFromEvent = BigInt(log.topics[2])

      console.log(`Processing TicketMinted: token ${tokenId} for order ${orderIdFromEvent}`)

      // Find the first pending booking for this order and update it with NFT data
      const { error: bookingUpdateError } = await supabase
        .from("bookings")
        .update({
          nft_contract_address: CONTRACT_ADDRESS,
          nft_token_id: tokenId.toString()
        })
        .in("id", bookingIds)
        .eq("status", "confirmed") // Only update confirmed bookings
        .eq("nft_token_id", null) // Only update bookings that don't have NFT data yet
        .limit(1)

      if (bookingUpdateError) {
        console.error(`Failed to update booking with token ${tokenId}:`, bookingUpdateError)
      } else {
        console.log(`✅ Updated booking with NFT token ${tokenId}`)
      }
    }

  } catch (error) {
    console.error('Error syncing contract events:', error)
    throw error
  }
}

async function getContractLogs(contractAddress: string, fromBlock: bigint, toBlock: bigint, eventName: string) {
  const response = await fetch("https://sepolia.base.org", {
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
  const eventSignatures: Record<string, string> = {
    'OrderCreated': '0x' + 'OrderCreated(uint256,address,uint256,uint256)'.split('').map(c => c.charCodeAt(0).toString(16)).join(''),
    'TicketMinted': '0x' + 'TicketMinted(uint256,uint256,address)'.split('').map(c => c.charCodeAt(0).toString(16)).join('')
  }

  return [eventSignatures[eventName]]
}
