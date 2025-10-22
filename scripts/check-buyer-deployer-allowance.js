#!/usr/bin/env node

/**
 * Script to check if buyer approved the deployer account
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

async function checkBuyerDeployerAllowance() {
  try {
    console.log('🔍 Checking buyer approval for deployer account...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const buyerAddress = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
    const deployerAddress = '0xc0BB2c4424E8a18eF8c6B3e79Fb182937c1f37dE'
    const unilaBookAddress = '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'
    
    console.log(`🛒 Buyer Address: ${buyerAddress}`)
    console.log(`🏗️  Deployer Address: ${deployerAddress}`)
    console.log(`📋 UnilaBook Contract: ${unilaBookAddress}`)
    
    // Check buyer's allowance for deployer
    console.log('\n1️⃣ Buyer Allowance for Deployer:')
    console.log('=' .repeat(50))
    
    const buyerDeployerAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [buyerAddress, deployerAddress]
    })
    
    console.log(`✅ Buyer -> Deployer Allowance: ${buyerDeployerAllowance.toString()} wei`)
    
    // Check buyer's allowance for UnilaBook contract
    console.log('\n2️⃣ Buyer Allowance for UnilaBook Contract:')
    console.log('=' .repeat(50))
    
    const buyerContractAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [buyerAddress, unilaBookAddress]
    })
    
    console.log(`✅ Buyer -> Contract Allowance: ${buyerContractAllowance.toString()} wei`)
    
    // Check if deployer has allowance from buyer
    const requiredAmount = parseEther('100.5')
    console.log(`\n💰 Required Amount: ${requiredAmount.toString()} wei`)
    
    if (buyerDeployerAllowance < requiredAmount) {
      console.log(`❌ Buyer has NOT approved deployer account!`)
      console.log(`   This explains why transferFrom fails`)
      console.log(`   The deployer account cannot spend buyer's tokens`)
    } else {
      console.log(`✅ Buyer has approved deployer account`)
    }
    
    if (buyerContractAllowance < requiredAmount) {
      console.log(`❌ Buyer has NOT approved UnilaBook contract!`)
    } else {
      console.log(`✅ Buyer has approved UnilaBook contract`)
    }
    
    console.log('\n✅ Allowance check completed!')
    
  } catch (error) {
    console.error('❌ Allowance check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkBuyerDeployerAllowance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkBuyerDeployerAllowance }
