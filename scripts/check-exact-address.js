#!/usr/bin/env node

/**
 * Script to check exact address matching between payment logs and contract
 */

// Load environment variables
require('dotenv').config()

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

async function checkExactAddressMatch() {
  try {
    console.log('🔍 Checking exact address matching...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    // Addresses from payment logs
    const paymentVendorAddress = '0x43606235E11641EFa7a45190aFB9e4cf9b0146eE'
    const buyerAddress = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
    
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`🛒 Buyer Address: ${buyerAddress}`)
    console.log(`🏪 Vendor Address: ${paymentVendorAddress}`)
    console.log(`🔍 Vendor Address (lowercase): ${paymentVendorAddress.toLowerCase()}`)
    console.log(`🔍 Vendor Address (uppercase): ${paymentVendorAddress.toUpperCase()}\n`)
    
    // Check whitelist status with exact address
    console.log('1️⃣ Checking whitelist with exact address:')
    console.log('=' .repeat(60))
    
    try {
      const isWhitelistedExact = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'whitelistedVendors',
        args: [paymentVendorAddress]
      })
      
      console.log(`✅ Exact address ${paymentVendorAddress}: ${isWhitelistedExact ? 'WHITELISTED' : 'NOT WHITELISTED'}`)
    } catch (error) {
      console.log(`❌ Error checking exact address: ${error.message}`)
    }
    
    // Check whitelist status with lowercase address
    console.log('\n2️⃣ Checking whitelist with lowercase address:')
    console.log('=' .repeat(60))
    
    try {
      const isWhitelistedLower = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'whitelistedVendors',
        args: [paymentVendorAddress.toLowerCase()]
      })
      
      console.log(`✅ Lowercase address ${paymentVendorAddress.toLowerCase()}: ${isWhitelistedLower ? 'WHITELISTED' : 'NOT WHITELISTED'}`)
    } catch (error) {
      console.log(`❌ Error checking lowercase address: ${error.message}`)
    }
    
    // Check if there's a checksum issue
    console.log('\n3️⃣ Address validation:')
    console.log('=' .repeat(60))
    
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(paymentVendorAddress)
    console.log(`✅ Address format valid: ${isValidAddress}`)
    
    // Check if it's a valid checksum
    const isChecksumValid = paymentVendorAddress === paymentVendorAddress.toLowerCase() || 
                           paymentVendorAddress === paymentVendorAddress.toUpperCase() ||
                           paymentVendorAddress.match(/^0x[a-fA-F0-9]{40}$/)
    console.log(`✅ Checksum valid: ${isChecksumValid}`)
    
    console.log('\n✅ Address check completed!')
    
  } catch (error) {
    console.error('❌ Address check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkExactAddressMatch()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkExactAddressMatch }
