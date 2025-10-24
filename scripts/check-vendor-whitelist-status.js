#!/usr/bin/env node

/**
 * Script to check vendor whitelist status for specific addresses
 * This helps diagnose the "Vendor not whitelisted" error
 */

const { createPublicClient, http } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract ABI for isVendorWhitelisted function
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vendor",
        "type": "address"
      }
    ],
    "name": "isVendorWhitelisted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getWhitelistedVendorsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getWhitelistedVendor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const CONTRACT_ADDRESS = "0xc4e90Dcd9Da001Dc463570d66d8281821De58D5C"
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// Vendor addresses from the error
const VENDOR_ADDRESSES = [
  "0x43606235E11641EFa7a45190aFB9e4cf9b0146eE",
  "0x5713f4236938865A29Bd9477D85C43Af083E297A"
]

async function checkVendorWhitelistStatus() {
  console.log('🔍 Checking vendor whitelist status...')
  console.log(`Contract: ${CONTRACT_ADDRESS}`)
  console.log(`RPC: ${RPC_URL}`)
  console.log('')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
  })

  try {
    // Get total whitelisted vendors count
    const totalCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'getWhitelistedVendorsCount'
    })
    
    console.log(`📊 Total whitelisted vendors: ${totalCount}`)
    console.log('')

    // Check each vendor address
    for (const vendorAddress of VENDOR_ADDRESSES) {
      console.log(`🔍 Checking vendor: ${vendorAddress}`)
      
      try {
        const isWhitelisted = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: contractABI,
          functionName: 'isVendorWhitelisted',
          args: [vendorAddress]
        })
        
        console.log(`   Status: ${isWhitelisted ? '✅ WHITELISTED' : '❌ NOT WHITELISTED'}`)
        
        if (!isWhitelisted) {
          console.log(`   ⚠️  This vendor needs to be whitelisted!`)
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking vendor: ${error.message}`)
      }
      
      console.log('')
    }

    // List all whitelisted vendors
    console.log('📋 All whitelisted vendors:')
    for (let i = 0; i < Number(totalCount); i++) {
      try {
        const vendorAddress = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: contractABI,
          functionName: 'getWhitelistedVendor',
          args: [BigInt(i)]
        })
        
        const isInErrorList = VENDOR_ADDRESSES.includes(vendorAddress)
        console.log(`   ${i + 1}. ${vendorAddress} ${isInErrorList ? '🎯 (IN ERROR)' : ''}`)
        
      } catch (error) {
        console.log(`   ${i + 1}. Error reading vendor ${i}: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the check
checkVendorWhitelistStatus()
  .then(() => {
    console.log('✅ Check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
