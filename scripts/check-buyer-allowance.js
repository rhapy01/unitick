#!/usr/bin/env node

/**
 * Script to check the BUYER's token allowance
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

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
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'
const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'

async function checkBuyerAllowance() {
  try {
    console.log('🔍 Checking BUYER token allowance...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const buyerAddress = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
    const requiredAmount = parseEther('100.5') // 100 + 0.5 platform fee
    
    console.log(`🛒 Buyer Address: ${buyerAddress}`)
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`💰 Required Amount: ${requiredAmount.toString()} wei`)
    
    // Check buyer's token balance
    console.log('\n1️⃣ Buyer Token Balance:')
    console.log('=' .repeat(50))
    
    const buyerBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [buyerAddress]
    })
    
    console.log(`✅ Buyer Balance: ${buyerBalance.toString()} wei`)
    console.log(`✅ Required: ${requiredAmount.toString()} wei`)
    console.log(`✅ Sufficient Balance: ${buyerBalance >= requiredAmount}`)
    
    if (buyerBalance < requiredAmount) {
      console.log(`❌ Buyer has insufficient token balance!`)
      return
    }
    
    // Check buyer's allowance
    console.log('\n2️⃣ Buyer Allowance:')
    console.log('=' .repeat(50))
    
    const buyerAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [buyerAddress, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Buyer Allowance: ${buyerAllowance.toString()} wei`)
    console.log(`✅ Required: ${requiredAmount.toString()} wei`)
    console.log(`✅ Sufficient Allowance: ${buyerAllowance >= requiredAmount}`)
    
    if (buyerAllowance < requiredAmount) {
      console.log(`❌ Buyer has insufficient allowance!`)
      console.log(`   The buyer needs to approve the contract to spend ${requiredAmount.toString()} wei`)
      console.log(`   Current allowance: ${buyerAllowance.toString()} wei`)
      console.log(`   Missing: ${(requiredAmount - buyerAllowance).toString()} wei`)
    } else {
      console.log(`✅ Buyer has sufficient allowance`)
    }
    
    console.log('\n✅ Buyer allowance check completed!')
    
  } catch (error) {
    console.error('❌ Buyer allowance check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkBuyerAllowance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkBuyerAllowance }
