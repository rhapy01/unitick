#!/usr/bin/env node

/**
 * Script to check and update vendor verification status
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

async function checkAndUpdateVendor() {
  try {
    console.log('🔍 Checking and updating vendor verification...\n')
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not found')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const vendorId = '0a8658e3-8850-4b18-8025-b550a30a7c12'
    
    console.log(`🆔 Checking vendor ID: ${vendorId}`)
    
    // First, let's see the current state
    const { data: currentVendor, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()
    
    if (fetchError) {
      console.log(`❌ Error fetching vendor: ${fetchError.message}`)
      return
    }
    
    if (!currentVendor) {
      console.log(`❌ No vendor found with ID: ${vendorId}`)
      return
    }
    
    console.log(`📋 Current vendor state:`)
    console.log(`   Business Name: ${currentVendor.business_name}`)
    console.log(`   Wallet: ${currentVendor.wallet_address}`)
    console.log(`   Verified: ${currentVendor.is_verified}`)
    console.log(`   Status: ${currentVendor.verification_status}`)
    
    // Now try to update
    console.log(`\n🔄 Attempting to update verification status...`)
    
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update({
        is_verified: true,
        verification_status: 'approved',
        is_featured: true
      })
      .eq('id', vendorId)
      .select()
      .single()
    
    if (updateError) {
      console.log(`❌ Error updating vendor: ${updateError.message}`)
      console.log(`   Error details:`, updateError)
      return
    }
    
    if (updatedVendor) {
      console.log(`✅ Vendor updated successfully:`)
      console.log(`   Business Name: ${updatedVendor.business_name}`)
      console.log(`   Wallet: ${updatedVendor.wallet_address}`)
      console.log(`   Verified: ${updatedVendor.is_verified}`)
      console.log(`   Status: ${updatedVendor.verification_status}`)
      console.log(`   Featured: ${updatedVendor.is_featured}`)
    }
    
    console.log('\n✅ Update completed!')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  checkAndUpdateVendor()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkAndUpdateVendor }
