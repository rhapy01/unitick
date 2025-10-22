#!/usr/bin/env node

/**
 * Script to check vendor whitelist status on the UnilaBook contract
 * Uses the private key from environment variables
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem')
const { baseSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

// Contract ABI for whitelist checking
const UNILABOOK_ABI = [
  {
    "inputs": [{"name": "vendor", "type": "address"}],
    "name": "whitelistedVendors",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "whitelistedAddresses",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformWallet",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// Contract addresses
const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'
const UNITICK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890'

// Test vendor addresses (you can modify these)
const TEST_VENDORS = [
  '0x43606235E11641EFa7a45190aFB9e4cf9b0146eE', // From the logs
  '0x1234567890123456789012345678901234567890', // Example vendor
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'  // Another example
]

async function checkVendorWhitelist() {
  try {
    console.log('🔍 Checking vendor whitelist status...\n')
    
    // Get private key from environment
    const privateKeyRaw = process.env.PRIVATE_KEYS
    if (!privateKeyRaw) {
      throw new Error('PRIVATE_KEYS environment variable is required')
    }
    
    // Add 0x prefix if not present
    const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`
    
    // Create clients
    const account = privateKeyToAccount(privateKey)
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    })
    
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`👤 Account Address: ${account.address}`)
    console.log(`⛓️  Chain: ${baseSepolia.name} (${baseSepolia.id})\n`)
    
    // Check platform wallet
    try {
      const platformWallet = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'platformWallet'
      })
      console.log(`🏦 Platform Wallet: ${platformWallet}`)
    } catch (error) {
      console.log(`❌ Failed to get platform wallet: ${error.message}`)
    }
    
    // Get all whitelisted addresses
    try {
      const allWhitelisted = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'whitelistedAddresses'
      })
      console.log(`📝 Total whitelisted addresses: ${allWhitelisted.length}`)
      if (allWhitelisted.length > 0) {
        console.log('   Whitelisted addresses:')
        allWhitelisted.forEach((addr, index) => {
          console.log(`   ${index + 1}. ${addr}`)
        })
      }
      console.log('')
    } catch (error) {
      console.log(`❌ Failed to get whitelisted addresses: ${error.message}\n`)
    }
    
    // Check specific vendors
    console.log('🔍 Checking specific vendors:')
    console.log('=' .repeat(60))
    
    for (const vendorAddress of TEST_VENDORS) {
      try {
        const isWhitelisted = await publicClient.readContract({
          address: UNILABOOK_CONTRACT_ADDRESS,
          abi: UNILABOOK_ABI,
          functionName: 'whitelistedVendors',
          args: [vendorAddress]
        })
        
        const status = isWhitelisted ? '✅ WHITELISTED' : '❌ NOT WHITELISTED'
        console.log(`${vendorAddress}: ${status}`)
        
      } catch (error) {
        console.log(`${vendorAddress}: ❌ ERROR - ${error.message}`)
      }
    }
    
    console.log('\n' + '=' .repeat(60))
    
    // Check account balance
    try {
      const balance = await publicClient.getBalance({ address: account.address })
      console.log(`💰 Account Balance: ${formatEther(balance)} ETH`)
    } catch (error) {
      console.log(`❌ Failed to get balance: ${error.message}`)
    }
    
    console.log('\n✅ Whitelist check completed!')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  checkVendorWhitelist()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkVendorWhitelist }
