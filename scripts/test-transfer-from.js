#!/usr/bin/env node

/**
 * Script to test transferFrom call directly
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, createWalletClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

// ERC20 ABI
const ERC20_ABI = [
  {
    "inputs": [
      {"name": "from", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'
const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'

async function testTransferFrom() {
  try {
    console.log('🔍 Testing transferFrom call directly...\n')
    
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
    
    const buyerAddress = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
    const transferAmount = parseEther('100.5') // 100 + 0.5 platform fee
    
    console.log(`🛒 Buyer Address: ${buyerAddress}`)
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`💰 Transfer Amount: ${transferAmount.toString()} wei`)
    
    // Test transferFrom simulation
    console.log('\n🔄 Testing transferFrom simulation...')
    console.log('=' .repeat(50))
    
    try {
      const simulationResult = await publicClient.simulateContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [buyerAddress, UNILABOOK_CONTRACT_ADDRESS, transferAmount],
        account
      })
      
      console.log(`✅ TransferFrom simulation successful!`)
      console.log(`   Gas estimate: ${simulationResult.request.gas}`)
      
    } catch (simulationError) {
      console.log(`❌ TransferFrom simulation failed: ${simulationError.message}`)
      
      // Check if it's the same error signature
      if (simulationError.message.includes('0xfb8f41b2')) {
        console.log(`   🔍 This is the same error signature!`)
        console.log(`   The issue is with the transferFrom call`)
      }
      
      return
    }
    
    console.log('\n✅ TransferFrom test completed!')
    
  } catch (error) {
    console.error('❌ TransferFrom test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testTransferFrom()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { testTransferFrom }
