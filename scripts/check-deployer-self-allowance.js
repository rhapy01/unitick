#!/usr/bin/env node

/**
 * Script to check deployer account's allowance for itself
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
  }
]

const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'

async function checkDeployerSelfAllowance() {
  try {
    console.log('🔍 Checking deployer account self-allowance...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const deployerAddress = '0xc0BB2c4424E8a18eF8c6B3e79Fb182937c1f37dE'
    const requiredAmount = parseEther('100.5')
    
    console.log(`🏗️  Deployer Address: ${deployerAddress}`)
    console.log(`💰 Required Amount: ${requiredAmount.toString()} wei`)
    
    // Check deployer's allowance for itself
    console.log('\n1️⃣ Deployer Self-Allowance:')
    console.log('=' .repeat(50))
    
    const selfAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [deployerAddress, deployerAddress]
    })
    
    console.log(`✅ Deployer Self-Allowance: ${selfAllowance.toString()} wei`)
    console.log(`✅ Required: ${requiredAmount.toString()} wei`)
    console.log(`✅ Sufficient Self-Allowance: ${selfAllowance >= requiredAmount}`)
    
    if (selfAllowance < requiredAmount) {
      console.log(`❌ Deployer doesn't have self-allowance!`)
      console.log(`   This could be the issue`)
    } else {
      console.log(`✅ Deployer has sufficient self-allowance`)
    }
    
    console.log('\n✅ Deployer self-allowance check completed!')
    
  } catch (error) {
    console.error('❌ Deployer self-allowance check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkDeployerSelfAllowance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkDeployerSelfAllowance }
