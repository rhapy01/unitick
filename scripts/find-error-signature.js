#!/usr/bin/env node

/**
 * Script to calculate error signatures and find the matching one
 */

const { keccak256, toHex } = require('viem')

async function findErrorSignature() {
  try {
    console.log('🔍 Finding error signature 0xfb8f41b2...\n')
    
    // Error messages from the contract
    const errorMessages = [
      "No vendor payments",
      "Too many vendors", 
      "Mismatched service names",
      "Mismatched booking dates",
      "Invalid vendor address",
      "Amount must be greater than 0",
      "Vendor not whitelisted",
      "Amount overflow",
      "Fee calculation overflow",
      "UniTick transfer failed",
      "Vendor token transfer failed",
      "Platform fee token transfer failed"
    ]
    
    console.log('📋 Checking error signatures:')
    console.log('=' .repeat(60))
    
    for (const errorMessage of errorMessages) {
      // Calculate keccak256 hash of the error message
      const errorSignature = keccak256(toHex(errorMessage))
      const shortSignature = errorSignature.slice(0, 10) // First 4 bytes
      
      console.log(`"${errorMessage}"`)
      console.log(`   Full: ${errorSignature}`)
      console.log(`   Short: ${shortSignature}`)
      
      if (shortSignature === '0xfb8f41b2') {
        console.log(`   ✅ MATCH FOUND!`)
      }
      console.log('')
    }
    
    console.log('✅ Error signature check completed!')
    
  } catch (error) {
    console.error('❌ Error signature check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  findErrorSignature()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { findErrorSignature }
