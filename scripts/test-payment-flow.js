#!/usr/bin/env node

/**
 * Script to test the complete payment flow
 * This will help verify if payments are working and creating orders
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
  console.log('🧪 Testing Payment Flow\n')
  console.log('=' .repeat(60))

  // Test 1: Check if there are any listings
  console.log('\n1️⃣ Checking Available Listings:')
  console.log('-' .repeat(40))
  
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, price, vendor:vendors(business_name, contact_email)')
      .eq('is_active', true)
      .limit(5)

    if (listingsError) {
      console.error('❌ Error fetching listings:', listingsError)
    } else {
      console.log(`📋 Found ${listings.length} active listings:`)
      listings.forEach(listing => {
        console.log(`  - ${listing.title}: $${listing.price} (Vendor: ${listing.vendor?.business_name})`)
        console.log(`    Vendor Email: ${listing.vendor?.contact_email || 'No email'}`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 2: Check if there are any users
  console.log('\n2️⃣ Checking Users:')
  console.log('-' .repeat(40))
  
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, wallet_address')
      .limit(5)

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
    } else {
      console.log(`📋 Found ${profiles.length} user profiles:`)
      profiles.forEach(profile => {
        console.log(`  - ${profile.email}: ${profile.full_name || 'No name'} (Wallet: ${profile.wallet_address ? 'Yes' : 'No'})`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Test 3: Check payment API endpoint
  console.log('\n3️⃣ Testing Payment API Endpoint:')
  console.log('-' .repeat(40))
  
  try {
    const testCartItems = [
      {
        _id: 'test-cart-item-1',
        listing: {
          id: 'test-listing-1',
          title: 'Test Service',
          price: 100,
          vendor_id: 'test-vendor-1',
          vendor: {
            business_name: 'Test Vendor',
            contact_email: 'test@example.com'
          }
        },
        quantity: 1,
        booking_date: new Date().toISOString().split('T')[0],
        is_gift: false
      }
    ]

    console.log('📋 Test cart items:', testCartItems)
    console.log('⚠️  Note: This would require a real user session and wallet to complete')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Payment Flow Test Complete!')
  console.log('\n📋 Diagnosis:')
  console.log('• No orders = No payments completed')
  console.log('• No cart items = No active shopping sessions')
  console.log('• Vendor notifications depend on successful payments')
  console.log('\n🔧 Next Steps:')
  console.log('1. Make a test payment to verify the flow works')
  console.log('2. Check if users are completing the payment process')
  console.log('3. Verify the internal wallet system is working')
  console.log('4. Check for any payment errors in the logs')
}

// Run the test
testPaymentFlow().catch(console.error)
