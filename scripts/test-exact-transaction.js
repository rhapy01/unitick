#!/usr/bin/env node

/**
 * Script to test the exact transaction parameters that failed
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, createWalletClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

// Contract ABI
const UNILABOOK_ABI = [
  {
    "inputs": [
      {
        "name": "_vendorPayments",
        "type": "tuple[]",
        "components": [
          {"name": "vendor", "type": "address"},
          {"name": "amount", "type": "uint256"},
          {"name": "isPaid", "type": "bool"}
        ]
      },
      {"name": "_serviceNames", "type": "string[]"},
      {"name": "_bookingDates", "type": "uint256[]"},
      {"name": "_metadata", "type": "string"}
    ],
    "name": "createOrder",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'

async function testExactTransaction() {
  try {
    console.log('🔍 Testing exact transaction parameters...\n')
    
    // Get private key from environment
    const privateKeyRaw = process.env.PRIVATE_KEYS
    if (!privateKeyRaw) {
      throw new Error('PRIVATE_KEYS environment variable is required')
    }
    
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
    
    // Exact parameters from the failed transaction logs
    const vendorPayments = [
      {
        vendor: '0x43606235E11641EFa7a45190aFB9e4cf9b0146eE',
        amount: parseEther('100'), // 100 tokens
        isPaid: false
      }
    ]
    
    const serviceNames = ['Mountain Hiking']
    const bookingDates = [BigInt(Math.floor(new Date('2025-10-18T14:40:00.867Z').getTime() / 1000))]
    const metadata = '{"buyerEmail":"akintoyeisaac5@gmail.com","totalItems":1,"timestamp":"2025-10-18T14:40:00.867Z"}'
    
    console.log('\n📊 Transaction Parameters:')
    console.log('=' .repeat(50))
    console.log(`🏪 Vendor Payments: ${vendorPayments.length}`)
    console.log(`   Vendor: ${vendorPayments[0].vendor}`)
    console.log(`   Amount: ${vendorPayments[0].amount.toString()} wei`)
    console.log(`   Is Paid: ${vendorPayments[0].isPaid}`)
    console.log(`📝 Service Names: ${serviceNames.length}`)
    console.log(`   Service: ${serviceNames[0]}`)
    console.log(`📅 Booking Dates: ${bookingDates.length}`)
    console.log(`   Date: ${bookingDates[0].toString()}`)
    console.log(`📄 Metadata: ${metadata}`)
    
    // Test simulation
    console.log('\n🔄 Testing contract simulation...')
    console.log('=' .repeat(50))
    
    try {
      const simulationResult = await publicClient.simulateContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'createOrder',
        args: [vendorPayments, serviceNames, bookingDates, metadata],
        account
      })
      
      console.log(`✅ Simulation successful!`)
      console.log(`   Predicted Order ID: ${simulationResult.result}`)
      console.log(`   Gas Estimate: ${simulationResult.request.gas}`)
      
    } catch (simulationError) {
      console.log(`❌ Simulation failed: ${simulationError.message}`)
      
      // Try to extract more specific error information
      if (simulationError.message.includes('Vendor not whitelisted')) {
        console.log(`   🔍 Issue: Vendor whitelist validation failed`)
      } else if (simulationError.message.includes('UniTick transfer failed')) {
        console.log(`   🔍 Issue: Token transfer from buyer to contract failed`)
      } else if (simulationError.message.includes('Vendor token transfer failed')) {
        console.log(`   🔍 Issue: Token transfer from contract to vendor failed`)
      } else if (simulationError.message.includes('Platform fee token transfer failed')) {
        console.log(`   🔍 Issue: Token transfer from contract to platform wallet failed`)
      } else {
        console.log(`   🔍 Issue: ${simulationError.message}`)
      }
      
      return
    }
    
    // Test gas estimation
    console.log('\n⛽ Testing gas estimation...')
    console.log('=' .repeat(50))
    
    try {
      const gasEstimate = await publicClient.estimateContractGas({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'createOrder',
        args: [vendorPayments, serviceNames, bookingDates, metadata],
        account
      })
      
      console.log(`✅ Gas estimate: ${gasEstimate.toString()}`)
      
    } catch (gasError) {
      console.log(`❌ Gas estimation failed: ${gasError.message}`)
    }
    
    console.log('\n✅ Transaction parameter test completed!')
    
  } catch (error) {
    console.error('❌ Transaction test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testExactTransaction()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { testExactTransaction }
