#!/usr/bin/env node

/**
 * Script to verify the vendor in the database
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

async function verifyVendor() {
  try {
    console.log('🔍 Verifying vendor in database...\n')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not found')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const vendorAddress = '0x43606235E11641EFa7a45190aFB9e4cf9b0146eE'
    const vendorId = '0a8658e3-8850-4b18-8025-b550a30a7c12' // From the database check
    
    console.log(`🏪 Verifying vendor: ${vendorAddress}`)
    console.log(`🆔 Vendor ID: ${vendorId}`)
    
    // Update vendor verification status using ID
    const { data, error } = await supabase
      .from('vendors')
      .update({
        is_verified: true,
        verification_status: 'approved',
        is_featured: true
      })
      .eq('id', vendorId)
      .select()
    
    if (error) {
      throw new Error(`Failed to verify vendor: ${error.message}`)
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Vendor verified successfully:`)
      console.log(`   Business Name: ${data[0].business_name}`)
      console.log(`   Wallet: ${data[0].wallet_address}`)
      console.log(`   Verified: ${data[0].is_verified}`)
      console.log(`   Status: ${data[0].verification_status}`)
    } else {
      console.log(`❌ No vendor found with ID: ${vendorId}`)
    }
    
    console.log('\n✅ Vendor verification completed!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

// Run the verification
if (require.main === module) {
  verifyVendor()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { verifyVendor }
