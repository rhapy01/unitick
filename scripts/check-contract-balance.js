#!/usr/bin/env node

/**
 * Script to check contract's UniTick token balance
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

// ERC20 ABI
const ERC20_ABI = [
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

async function checkContractBalance() {
  try {
    console.log('🔍 Checking contract UniTick token balance...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`🪙 UniTick Token: ${UNITICK_CONTRACT_ADDRESS}`)
    
    // Check contract's token balance
    console.log('\n1️⃣ Contract Token Balance:')
    console.log('=' .repeat(50))
    
    const contractBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Contract Balance: ${contractBalance.toString()} wei`)
    console.log(`✅ Contract Balance: ${(Number(contractBalance) / 1e18).toFixed(6)} UniTick`)
    
    // Check if contract has enough tokens for a typical payment
    const typicalPayment = parseEther('100') // 100 tokens
    console.log(`\n💰 Typical Payment: ${typicalPayment.toString()} wei`)
    console.log(`✅ Sufficient for payment: ${contractBalance >= typicalPayment}`)
    
    if (contractBalance < typicalPayment) {
      console.log(`❌ Contract has insufficient tokens for payments!`)
      console.log(`   Required: ${typicalPayment.toString()} wei`)
      console.log(`   Available: ${contractBalance.toString()} wei`)
      console.log(`   Missing: ${(typicalPayment - contractBalance).toString()} wei`)
    } else {
      console.log(`✅ Contract has sufficient tokens for payments`)
    }
    
    console.log('\n✅ Contract balance check completed!')
    
  } catch (error) {
    console.error('❌ Contract balance check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkContractBalance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkContractBalance }
