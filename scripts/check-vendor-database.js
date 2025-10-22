#!/usr/bin/env node

/**
 * Script to check vendor wallet addresses in the database vs contract whitelist
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')
const { createPublicClient, http } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract ABI
const UNILABOOK_ABI = [
  {
    "inputs": [{"name": "vendor", "type": "address"}],
    "name": "whitelistedVendors",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
]

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'

async function checkVendorDatabase() {
  try {
    console.log('🔍 Checking vendor database vs contract whitelist...\n')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not found')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Initialize blockchain client
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`🗄️  Database URL: ${supabaseUrl}\n`)
    
    // Get all vendors from database
    console.log('1️⃣ Fetching vendors from database...')
    console.log('=' .repeat(60))
    
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, wallet_address, is_verified')
      .order('created_at', { ascending: false })
    
    if (vendorsError) {
      throw new Error(`Failed to fetch vendors: ${vendorsError.message}`)
    }
    
    console.log(`📊 Found ${vendors.length} vendors in database:`)
    
    for (const vendor of vendors) {
      console.log(`\n🏪 Vendor: ${vendor.business_name}`)
      console.log(`   ID: ${vendor.id}`)
      console.log(`   Wallet: ${vendor.wallet_address}`)
      console.log(`   Verified: ${vendor.is_verified}`)
      
      if (!vendor.wallet_address) {
        console.log(`   ❌ ERROR: No wallet address!`)
        continue
      }
      
      if (!vendor.wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.log(`   ❌ ERROR: Invalid wallet address format!`)
        continue
      }
      
      // Check if vendor is whitelisted on contract
      try {
        const isWhitelisted = await publicClient.readContract({
          address: UNILABOOK_CONTRACT_ADDRESS,
          abi: UNILABOOK_ABI,
          functionName: 'whitelistedVendors',
          args: [vendor.wallet_address]
        })
        
        if (isWhitelisted) {
          console.log(`   ✅ WHITELISTED on contract`)
        } else {
          console.log(`   ❌ NOT WHITELISTED on contract`)
        }
        
      } catch (whitelistError) {
        console.log(`   ❌ ERROR checking whitelist: ${whitelistError.message}`)
      }
    }
    
    // Check specific vendor from payment logs
    console.log('\n2️⃣ Checking specific vendor from payment logs...')
    console.log('=' .repeat(60))
    
    const paymentVendorAddress = '0x43606235E11641EFa7a45190aFB9e4cf9b0146eE'
    console.log(`🔍 Looking for vendor with address: ${paymentVendorAddress}`)
    
    const matchingVendor = vendors.find(v => v.wallet_address?.toLowerCase() === paymentVendorAddress.toLowerCase())
    
    if (matchingVendor) {
      console.log(`✅ Found matching vendor in database:`)
      console.log(`   Business Name: ${matchingVendor.business_name}`)
      console.log(`   ID: ${matchingVendor.id}`)
      console.log(`   Verified: ${matchingVendor.is_verified}`)
    } else {
      console.log(`❌ NO MATCHING VENDOR FOUND in database!`)
      console.log(`   This vendor address is not in the database`)
      console.log(`   This could be the cause of the transaction reversion`)
    }
    
    // Check deployer address
    console.log('\n3️⃣ Checking deployer/owner address...')
    console.log('=' .repeat(60))
    
    try {
      const deployerAddress = '0xc0BB2c4424E8a18eF8c6B3e79Fb182937c1f37dE' // From our previous checks
      console.log(`🏗️  Deployer Address: ${deployerAddress}`)
      
      const deployerVendor = vendors.find(v => v.wallet_address?.toLowerCase() === deployerAddress.toLowerCase())
      
      if (deployerVendor) {
        console.log(`✅ Deployer is registered as vendor:`)
        console.log(`   Business Name: ${deployerVendor.business_name}`)
        console.log(`   Verified: ${deployerVendor.is_verified}`)
      } else {
        console.log(`❌ Deployer is NOT registered as vendor in database`)
      }
      
    } catch (error) {
      console.log(`❌ Error checking deployer: ${error.message}`)
    }
    
    console.log('\n✅ Database check completed!')
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkVendorDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkVendorDatabase }
