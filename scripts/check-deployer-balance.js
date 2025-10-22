#!/usr/bin/env node

/**
 * Script to check deployer account's UniTick token balance
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

const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'

async function checkDeployerBalance() {
  try {
    console.log('🔍 Checking deployer account UniTick token balance...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const deployerAddress = '0xc0BB2c4424E8a18eF8c6B3e79Fb182937c1f37dE'
    const requiredAmount = parseEther('100.5') // 100 + 0.5 platform fee
    
    console.log(`🏗️  Deployer Address: ${deployerAddress}`)
    console.log(`💰 Required Amount: ${requiredAmount.toString()} wei`)
    
    // Check deployer's token balance
    console.log('\n1️⃣ Deployer Token Balance:')
    console.log('=' .repeat(50))
    
    const deployerBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [deployerAddress]
    })
    
    console.log(`✅ Deployer Balance: ${deployerBalance.toString()} wei`)
    console.log(`✅ Deployer Balance: ${(Number(deployerBalance) / 1e18).toFixed(6)} UniTick`)
    console.log(`✅ Required: ${requiredAmount.toString()} wei`)
    console.log(`✅ Sufficient Balance: ${deployerBalance >= requiredAmount}`)
    
    if (deployerBalance < requiredAmount) {
      console.log(`❌ Deployer has insufficient UniTick tokens!`)
      console.log(`   Required: ${requiredAmount.toString()} wei`)
      console.log(`   Available: ${deployerBalance.toString()} wei`)
      console.log(`   Missing: ${(requiredAmount - deployerBalance).toString()} wei`)
      console.log(`\n🔍 This explains the transaction reversion!`)
      console.log(`   The deployer account is calling the contract`)
      console.log(`   The contract tries to transfer tokens FROM deployer TO contract`)
      console.log(`   But deployer doesn't have enough tokens`)
    } else {
      console.log(`✅ Deployer has sufficient tokens`)
    }
    
    console.log('\n✅ Deployer balance check completed!')
    
  } catch (error) {
    console.error('❌ Deployer balance check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkDeployerBalance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkDeployerBalance }
