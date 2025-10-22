#!/usr/bin/env node

/**
 * Script to test UniTick token transfer separately
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
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
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

async function testTokenTransfer() {
  try {
    console.log('🔍 Testing UniTick token transfer...\n')
    
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
    
    console.log(`📋 UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
    console.log(`📋 UnilaBook Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`👤 Account: ${account.address}`)
    
    const transferAmount = parseEther('100.5') // Total amount including fee
    
    // Check allowance
    console.log('\n1️⃣ Checking allowance...')
    console.log('=' .repeat(50))
    
    const allowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Allowance: ${allowance.toString()} wei`)
    console.log(`✅ Required: ${transferAmount.toString()} wei`)
    console.log(`✅ Sufficient: ${allowance >= transferAmount}`)
    
    if (allowance < transferAmount) {
      console.log(`❌ Insufficient allowance!`)
      return
    }
    
    // Test transferFrom simulation
    console.log('\n2️⃣ Testing transferFrom simulation...')
    console.log('=' .repeat(50))
    
    try {
      const simulationResult = await publicClient.simulateContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [account.address, UNILABOOK_CONTRACT_ADDRESS, transferAmount],
        account
      })
      
      console.log(`✅ TransferFrom simulation successful!`)
      console.log(`   Gas estimate: ${simulationResult.request.gas}`)
      
    } catch (simulationError) {
      console.log(`❌ TransferFrom simulation failed: ${simulationError.message}`)
      
      // Check if it's a specific error
      if (simulationError.message.includes('0xfb8f41b2')) {
        console.log(`   🔍 This is the same error signature!`)
        console.log(`   The issue is with the UniTick token transfer`)
      }
      
      return
    }
    
    console.log('\n✅ Token transfer test completed!')
    
  } catch (error) {
    console.error('❌ Token transfer test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testTokenTransfer()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { testTokenTransfer }
