#!/usr/bin/env node

/**
 * Detailed test to debug why notifications aren't working
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

async function debugNotificationIssue() {
  console.log('🔍 Debugging Notification Issue\n')
  console.log('=' .repeat(60))

  // Check if there are any orders at all
  console.log('\n1️⃣ Checking Database State:')
  console.log('-' .repeat(40))
  
  const { data: orders } = await supabase.from('orders').select('count').single()
  const { data: bookings } = await supabase.from('bookings').select('count').single()
  const { data: cartItems } = await supabase.from('cart_items').select('count').single()
  const { data: orderItems } = await supabase.from('order_items').select('count').single()
  
  console.log(`Orders: ${orders?.count || 0}`)
  console.log(`Bookings: ${bookings?.count || 0}`)
  console.log(`Cart Items: ${cartItems?.count || 0}`)
  console.log(`Order Items: ${orderItems?.count || 0}`)

  // Check vendors
  console.log('\n2️⃣ Checking Vendors:')
  console.log('-' .repeat(40))
  
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, contact_email, is_verified')
    .not('contact_email', 'is', null)
  
  console.log(`Vendors with emails: ${vendors?.length || 0}`)
  if (vendors && vendors.length > 0) {
    vendors.forEach(vendor => {
      console.log(`- ${vendor.business_name}: ${vendor.contact_email} (Verified: ${vendor.is_verified})`)
    })
  }

  // Test verify-payment function with detailed error
  console.log('\n3️⃣ Testing verify-payment Function:')
  console.log('-' .repeat(40))
  
  try {
    const testRequest = {
      transactionHash: 'contract_12345',
      orderId: 'test-order-123',
      expectedAmount: '100000000000000000000',
      fromAddress: '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88',
      toAddress: '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08',
      chainId: 84532
    }
    
    console.log('Test request:', testRequest)
    
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: testRequest
    })
    
    if (error) {
      console.log('❌ verify-payment error:', error.message)
      console.log('Error type:', error.name)
      console.log('Error context:', error.context)
    } else {
      console.log('✅ verify-payment success:', data)
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🔍 Debug Complete!')
  
  if ((orders?.count || 0) === 0) {
    console.log('\n💡 Issue: No orders in database')
    console.log('• This means no payments have been completed')
    console.log('• Try making a payment to test the notification system')
  } else {
    console.log('\n💡 Issue: Orders exist but notifications not working')
    console.log('• Check verify-payment function logs')
    console.log('• Check if vendors have contact emails')
    console.log('• Check if order_items are created properly')
  }
}

debugNotificationIssue().catch(console.error)
