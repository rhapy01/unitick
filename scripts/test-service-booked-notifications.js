#!/usr/bin/env node

/**
 * Script to test the service booked notification system
 * This will help debug why vendor notifications are not being sent
 */

require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testServiceBookedNotifications() {
  console.log('🧪 Testing Service Booked Notification System\n')
  console.log('=' .repeat(60))

  // Test 1: Check if there are any orders at all
  console.log('\n1️⃣ Checking All Orders:')
  console.log('-' .repeat(40))
  
  try {
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, transaction_hash, created_at, user_id')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
    } else {
      console.log(`📋 Total orders in database: ${allOrders.length}`)
      if (allOrders.length > 0) {
        console.log('Recent orders:')
        allOrders.slice(0, 3).forEach((order, index) => {
          console.log(`  ${index + 1}. Order ${order.id}: ${order.status} (${order.transaction_hash})`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 2: Check if there are any bookings
  console.log('\n2️⃣ Checking All Bookings:')
  console.log('-' .repeat(40))
  
  try {
    const { data: allBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, vendor_id, status, created_at, listing:listings(title, vendor:vendors(business_name, contact_email))')
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError)
    } else {
      console.log(`📋 Total bookings in database: ${allBookings.length}`)
      if (allBookings.length > 0) {
        console.log('Recent bookings:')
        allBookings.slice(0, 3).forEach((booking, index) => {
          console.log(`  ${index + 1}. Booking ${booking.id}: ${booking.listing?.title} (Vendor: ${booking.listing?.vendor?.business_name})`)
        })
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 3: Test verify-payment function with a real order (if exists)
  console.log('\n3️⃣ Testing verify-payment Function:')
  console.log('-' .repeat(40))
  
  try {
    // Get the most recent order
    const { data: latestOrder } = await supabase
      .from('orders')
      .select('id, transaction_hash, user_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestOrder) {
      console.log(`📋 Testing with latest order: ${latestOrder.id}`)
      
      const testRequest = {
        transactionHash: latestOrder.transaction_hash,
        orderId: latestOrder.id,
        expectedAmount: '100000000000000000000', // 100 tokens
        fromAddress: '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88',
        toAddress: '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08',
        chainId: 84532
      }

      console.log('📋 Test request:', testRequest)
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: testRequest
      })

      if (error) {
        console.log('⚠️  verify-payment error:', error.message)
      } else {
        console.log('✅ verify-payment response:', data)
      }
    } else {
      console.log('❌ No orders found to test with')
      console.log('💡 This explains why service booked notifications are not working!')
    }
  } catch (error) {
    console.error('❌ Error testing verify-payment:', error.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Service Booked Notification Test Complete!')
  console.log('\n📋 Diagnosis:')
  if (allOrders?.length === 0) {
    console.log('• No orders in database = No payments completed')
    console.log('• No payments = No service booked notifications')
    console.log('• The notification system depends on successful payments')
  } else {
    console.log('• Orders exist but notifications not working')
    console.log('• Check verify-payment function logs for errors')
    console.log('• Check if customer information is being retrieved properly')
  }
  console.log('\n🔧 Next Steps:')
  console.log('1. Make a test payment to create an order')
  console.log('2. Check if verify-payment function finds the order')
  console.log('3. Verify customer information is retrieved correctly')
  console.log('4. Check if vendor notification email is sent')
}

// Run the test
testServiceBookedNotifications().catch(console.error)
