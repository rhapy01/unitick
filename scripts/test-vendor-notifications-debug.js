#!/usr/bin/env node

/**
 * Script to test vendor booking notification emails
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

async function testVendorNotifications() {
  console.log('🧪 Testing Vendor Booking Notification System\n')
  console.log('=' .repeat(60))

  // Test 1: Check recent orders
  console.log('\n1️⃣ Checking Recent Orders:')
  console.log('-' .repeat(40))
  
  try {
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, transaction_hash, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
    } else {
      console.log(`📋 Found ${recentOrders.length} recent orders:`)
      recentOrders.forEach(order => {
        console.log(`  - Order ${order.id}: ${order.status} (${order.transaction_hash})`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 2: Check recent bookings
  console.log('\n2️⃣ Checking Recent Bookings:')
  console.log('-' .repeat(40))
  
  try {
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, vendor_id, status, created_at, listing:listings(title, vendor:vendors(business_name, contact_email))')
      .order('created_at', { ascending: false })
      .limit(5)

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError)
    } else {
      console.log(`📋 Found ${recentBookings.length} recent bookings:`)
      recentBookings.forEach(booking => {
        console.log(`  - Booking ${booking.id}: ${booking.listing?.title} (Vendor: ${booking.listing?.vendor?.business_name})`)
        console.log(`    Email: ${booking.listing?.vendor?.contact_email || 'No email'}`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 3: Check vendors with contact emails
  console.log('\n3️⃣ Checking Vendors with Contact Emails:')
  console.log('-' .repeat(40))
  
  try {
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, contact_email, is_verified')
      .not('contact_email', 'is', null)

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError)
    } else {
      console.log(`📋 Found ${vendors.length} vendors with contact emails:`)
      vendors.forEach(vendor => {
        console.log(`  - ${vendor.business_name}: ${vendor.contact_email} (Verified: ${vendor.is_verified})`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 4: Test verify-payment function directly
  console.log('\n4️⃣ Testing verify-payment Function:')
  console.log('-' .repeat(40))
  
  try {
    // Get the most recent order
    const { data: latestOrder } = await supabase
      .from('orders')
      .select('id, transaction_hash')
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
      console.log('❌ No recent orders found to test with')
    }
  } catch (error) {
    console.error('❌ Error testing verify-payment:', error.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Vendor Notification Test Complete!')
  console.log('\n📋 Next Steps:')
  console.log('1. Check if vendors have contact_email addresses')
  console.log('2. Verify that bookings are being created')
  console.log('3. Check if verify-payment function is being called')
  console.log('4. Check Supabase function logs for errors')
}

// Run the test
testVendorNotifications().catch(console.error)
