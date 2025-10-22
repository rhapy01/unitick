#!/usr/bin/env node

/**
 * Script to check buyer's ETH balance for gas
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

async function checkBuyerGasBalance() {
  try {
    console.log('🔍 Checking buyer ETH balance for gas...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const buyerAddress = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
    
    console.log(`🛒 Buyer Address: ${buyerAddress}`)
    
    // Check buyer's ETH balance
    console.log('\n1️⃣ Buyer ETH Balance:')
    console.log('=' .repeat(50))
    
    const ethBalance = await publicClient.getBalance({ address: buyerAddress })
    console.log(`✅ ETH Balance: ${ethBalance.toString()} wei`)
    console.log(`✅ ETH Balance: ${(Number(ethBalance) / 1e18).toFixed(6)} ETH`)
    
    // Check if buyer has enough ETH for gas
    const minGasBalance = parseEther('0.001') // Minimum 0.001 ETH for gas
    console.log(`\n💰 Minimum Required: ${minGasBalance.toString()} wei`)
    console.log(`✅ Sufficient for gas: ${ethBalance >= minGasBalance}`)
    
    if (ethBalance < minGasBalance) {
      console.log(`❌ Buyer has insufficient ETH for gas!`)
      console.log(`   Required: ${minGasBalance.toString()} wei`)
      console.log(`   Available: ${ethBalance.toString()} wei`)
      console.log(`   Missing: ${(minGasBalance - ethBalance).toString()} wei`)
    } else {
      console.log(`✅ Buyer has sufficient ETH for gas`)
    }
    
    // Check recent gas prices
    console.log('\n2️⃣ Recent Gas Prices:')
    console.log('=' .repeat(50))
    
    try {
      const gasPrice = await publicClient.getGasPrice()
      console.log(`✅ Current Gas Price: ${gasPrice.toString()} wei`)
      console.log(`✅ Current Gas Price: ${(Number(gasPrice) / 1e9).toFixed(2)} Gwei`)
      
      // Estimate gas cost for a typical transaction
      const estimatedGas = 500000n // Typical gas limit
      const estimatedCost = gasPrice * estimatedGas
      console.log(`\n💰 Estimated Gas Cost:`)
      console.log(`   Gas Limit: ${estimatedGas.toString()}`)
      console.log(`   Gas Price: ${gasPrice.toString()} wei`)
      console.log(`   Total Cost: ${estimatedCost.toString()} wei`)
      console.log(`   Total Cost: ${(Number(estimatedCost) / 1e18).toFixed(6)} ETH`)
      
      console.log(`✅ Sufficient for estimated cost: ${ethBalance >= estimatedCost}`)
      
    } catch (gasError) {
      console.log(`❌ Error getting gas price: ${gasError.message}`)
    }
    
    console.log('\n✅ Gas balance check completed!')
    
  } catch (error) {
    console.error('❌ Gas balance check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkBuyerGasBalance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkBuyerGasBalance }
