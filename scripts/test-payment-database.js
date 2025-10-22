#!/usr/bin/env node

/**
 * Test the exact payment flow to find where it fails
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

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Flow Step by Step\n')
  console.log('=' .repeat(60))

  // Step 1: Test order creation
  console.log('\n1️⃣ Testing Order Creation:')
  console.log('-' .repeat(40))
  
  try {
    const testOrderId = 'test-order-' + Date.now()
    const testUserId = 'test-user-id'
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: testOrderId,
        user_id: testUserId,
        total_amount: 100.50,
        platform_fee_total: 0.50,
        wallet_address: '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88',
        transaction_hash: 'contract_12345',
        status: 'confirmed',
        nft_batch_contract_address: '0xcontract123',
        nft_batch_id: '12345',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.log('❌ Order creation failed:', orderError.message)
      console.log('Error details:', orderError)
    } else {
      console.log('✅ Order created successfully:', orderData.id)
    }
  } catch (error) {
    console.log('❌ Order creation exception:', error.message)
  }

  // Step 2: Test booking creation
  console.log('\n2️⃣ Testing Booking Creation:')
  console.log('-' .repeat(40))
  
  try {
    const testBookingId = 'test-booking-' + Date.now()
    
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: testBookingId,
        user_id: 'test-user-id',
        listing_id: 'test-listing-id',
        vendor_id: 'test-vendor-id',
        booking_date: new Date().toISOString().split('T')[0],
        quantity: 1,
        subtotal: 100,
        platform_fee: 0.50,
        total_amount: 100.50,
        status: 'confirmed',
        is_gift: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bookingError) {
      console.log('❌ Booking creation failed:', bookingError.message)
      console.log('Error details:', bookingError)
    } else {
      console.log('✅ Booking created successfully:', bookingData.id)
    }
  } catch (error) {
    console.log('❌ Booking creation exception:', error.message)
  }

  // Step 3: Test order_items creation
  console.log('\n3️⃣ Testing Order Items Creation:')
  console.log('-' .repeat(40))
  
  try {
    const { data: orderItemData, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: 'test-order-' + Date.now(),
        booking_id: 'test-booking-' + Date.now()
      })
      .select()
      .single()

    if (orderItemError) {
      console.log('❌ Order item creation failed:', orderItemError.message)
      console.log('Error details:', orderItemError)
    } else {
      console.log('✅ Order item created successfully:', orderItemData.id)
    }
  } catch (error) {
    console.log('❌ Order item creation exception:', error.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🔍 Payment Flow Test Complete!')
  console.log('This will show which database operations are failing.')
}

testPaymentFlow().catch(console.error)
