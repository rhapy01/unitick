require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service role key')
  console.log('💡 Please set SUPABASE_SERVICE_ROLE_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runManualSync() {
  try {
    console.log('🔄 Starting manual contract sync...')

    // Step 1: Get all pending orders with wallet addresses
    console.log('📊 Finding pending orders...')
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        transaction_hash,
        wallet_address,
        total_amount,
        order_items!inner(booking_id)
      `)
      .eq('status', 'pending')
      .not('wallet_address', 'is', null)

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }

    console.log(`📋 Found ${pendingOrders.length} pending orders with wallet addresses`)

    // Step 2: For each pending order, check if it should be confirmed
    for (const order of pendingOrders) {
      console.log(`🔍 Processing order ${order.id} for wallet ${order.wallet_address}`)

      // For demo purposes, let's manually confirm orders that look like they should be confirmed
      // In production, you'd check actual blockchain events here
      const shouldConfirm = order.wallet_address && order.total_amount > 0

      if (shouldConfirm) {
        console.log(`✅ Confirming order ${order.id}`)

        // Get booking IDs for this order
        const bookingIds = order.order_items.map(oi => oi.booking_id)

        // Update order
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            transaction_hash: 'contract_manual_sync_' + Date.now(),
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id)

        if (orderError) {
          console.error(`❌ Failed to update order ${order.id}:`, orderError)
          continue
        }

        // Update bookings
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .in('id', bookingIds)

        if (bookingError) {
          console.error(`❌ Failed to update bookings for order ${order.id}:`, bookingError)
        } else {
          console.log(`✅ Successfully confirmed order ${order.id} and ${bookingIds.length} bookings`)
        }
      } else {
        console.log(`⏭️ Skipping order ${order.id} (no wallet or zero amount)`)
      }
    }

    console.log('✅ Manual sync complete!')

    // Step 3: Show final status
    console.log('\n📊 Final Status:')
    const { data: finalOrders } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        transaction_hash,
        order_items!inner(booking_id)
      `)
      .in('id', pendingOrders.map(o => o.id))

    const confirmed = finalOrders.filter(o => o.status === 'confirmed').length
    const stillPending = finalOrders.filter(o => o.status === 'pending').length

    console.log(`✅ Confirmed orders: ${confirmed}`)
    console.log(`⏳ Still pending: ${stillPending}`)

  } catch (error) {
    console.error('❌ Sync error:', error)
  }
}

runManualSync()
