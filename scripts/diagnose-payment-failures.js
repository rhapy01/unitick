#!/usr/bin/env node

/**
 * Script to diagnose payment process failures
 * This will check all the potential failure points in the payment flow
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

async function diagnosePaymentFailures() {
  console.log('🔍 Diagnosing Payment Process Failures\n')
  console.log('=' .repeat(60))

  // Check 1: Listings and vendor wallet addresses
  console.log('\n1️⃣ Checking Listings and Vendor Wallet Addresses:')
  console.log('-' .repeat(40))
  
  try {
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, price, vendor_id, vendor:vendors(id, business_name, wallet_address)')
      .eq('is_active', true)

    if (listingsError) {
      console.error('❌ Error fetching listings:', listingsError)
    } else {
      console.log(`📋 Found ${listings.length} active listings:`)
      listings.forEach(listing => {
        const hasWallet = !!listing.vendor?.wallet_address
        console.log(`- ${listing.title}: $${listing.price} (Vendor: ${listing.vendor?.business_name})`)
        console.log(`  Wallet Address: ${hasWallet ? listing.vendor.wallet_address : '❌ MISSING'}`)
        if (!hasWallet) {
          console.log(`  ⚠️  ISSUE: Vendor ${listing.vendor?.business_name} has no wallet address!`)
        }
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Check 2: User profiles and wallet addresses
  console.log('\n2️⃣ Checking User Profiles and Wallet Addresses:')
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
        const hasWallet = !!profile.wallet_address
        console.log(`- ${profile.email}: ${profile.full_name || 'No name'}`)
        console.log(`  Wallet Address: ${hasWallet ? profile.wallet_address : '❌ MISSING'}`)
        if (!hasWallet) {
          console.log(`  ⚠️  ISSUE: User ${profile.email} has no wallet address!`)
        }
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  // Check 3: Environment variables
  console.log('\n3️⃣ Checking Required Environment Variables:')
  console.log('-' .repeat(40))
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_RPC_URL',
    'NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS',
    'PRIVATE_KEYS'
  ]
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    const hasValue = !!value
    console.log(`${envVar}: ${hasValue ? '✅ SET' : '❌ MISSING'}`)
    if (!hasValue) {
      console.log(`  ⚠️  ISSUE: ${envVar} is required for payment processing!`)
    }
  })

  // Check 4: Contract addresses
  console.log('\n4️⃣ Checking Contract Addresses:')
  console.log('-' .repeat(40))
  
  const unilaBookAddress = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS
  const uniTickAddress = process.env.NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS
  
  console.log(`UniLaBook Contract: ${unilaBookAddress || '❌ MISSING'}`)
  console.log(`UniTick Contract: ${uniTickAddress || '❌ MISSING'}`)
  
  if (unilaBookAddress && uniTickAddress) {
    console.log('✅ Contract addresses are set')
  } else {
    console.log('❌ Contract addresses are missing!')
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🔍 Payment Failure Diagnosis Complete!')
  
  console.log('\n💡 Common Payment Failure Causes:')
  console.log('1. Vendor has no wallet_address in database')
  console.log('2. User has no wallet_address in profile')
  console.log('3. Missing environment variables (PRIVATE_KEYS, contract addresses)')
  console.log('4. Insufficient ETH balance for gas fees')
  console.log('5. Insufficient UniTick token balance')
  console.log('6. Insufficient UniTick token allowance')
  console.log('7. Vendor not whitelisted on contract')
  console.log('8. Contract simulation failure')
  
  console.log('\n🔧 Next Steps:')
  console.log('1. Fix any missing wallet addresses')
  console.log('2. Ensure environment variables are set')
  console.log('3. Check token balances and allowances')
  console.log('4. Verify vendor whitelist status')
  console.log('5. Test payment with proper data')
}

diagnosePaymentFailures().catch(console.error)
