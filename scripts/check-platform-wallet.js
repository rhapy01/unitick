#!/usr/bin/env node

/**
 * Script to check platform wallet and fee calculation issues
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, http, formatEther, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract ABIs
const UNILABOOK_ABI = [
  {
    "inputs": [],
    "name": "platformWallet",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeeBps",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniTickToken",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

const UNITICK_ABI = [
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'

async function checkPlatformWalletIssues() {
  try {
    console.log('🔍 Checking platform wallet and fee calculation...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    
    // Get contract configuration
    console.log('\n1️⃣ Contract Configuration:')
    console.log('=' .repeat(50))
    
    const platformWallet = await publicClient.readContract({
      address: UNILABOOK_CONTRACT_ADDRESS,
      abi: UNILABOOK_ABI,
      functionName: 'platformWallet'
    })
    console.log(`✅ Platform Wallet: ${platformWallet}`)
    
    const platformFeeBps = await publicClient.readContract({
      address: UNILABOOK_CONTRACT_ADDRESS,
      abi: UNILABOOK_ABI,
      functionName: 'platformFeeBps'
    })
    console.log(`✅ Platform Fee: ${platformFeeBps} bps (${Number(platformFeeBps)/100}%)`)
    
    const uniTickTokenAddress = await publicClient.readContract({
      address: UNILABOOK_CONTRACT_ADDRESS,
      abi: UNILABOOK_ABI,
      functionName: 'uniTickToken'
    })
    console.log(`✅ UniTick Token: ${uniTickTokenAddress}`)
    
    // Check platform wallet balance
    console.log('\n2️⃣ Platform Wallet Balance:')
    console.log('=' .repeat(50))
    
    const platformBalance = await publicClient.readContract({
      address: uniTickTokenAddress,
      abi: UNITICK_ABI,
      functionName: 'balanceOf',
      args: [platformWallet]
    })
    console.log(`✅ Platform Wallet UniTick Balance: ${formatEther(platformBalance)}`)
    
    // Check platform wallet ETH balance
    const platformEthBalance = await publicClient.getBalance({ address: platformWallet })
    console.log(`✅ Platform Wallet ETH Balance: ${formatEther(platformEthBalance)}`)
    
    // Test fee calculation
    console.log('\n3️⃣ Fee Calculation Test:')
    console.log('=' .repeat(50))
    
    const testAmount = parseEther('100') // 100 tokens
    const calculatedFee = (testAmount * platformFeeBps) / 10000n
    const totalAmount = testAmount + calculatedFee
    
    console.log(`💰 Test Amount: ${formatEther(testAmount)} UniTick`)
    console.log(`💸 Calculated Fee: ${formatEther(calculatedFee)} UniTick`)
    console.log(`📊 Total Amount: ${formatEther(totalAmount)} UniTick`)
    
    // Check if platform wallet is the same as contract deployer
    console.log('\n4️⃣ Address Comparison:')
    console.log('=' .repeat(50))
    
    const deployerAddress = '0xc0BB2c4424E8a18eF8c6B3e79Fb182937c1f37dE'
    console.log(`🏗️  Deployer Address: ${deployerAddress}`)
    console.log(`🏦 Platform Wallet: ${platformWallet}`)
    console.log(`🔄 Same Address: ${platformWallet.toLowerCase() === deployerAddress.toLowerCase()}`)
    
    // Check if platform wallet can receive tokens (not a contract)
    console.log('\n5️⃣ Platform Wallet Type Check:')
    console.log('=' .repeat(50))
    
    try {
      const platformWalletCode = await publicClient.getBytecode({ address: platformWallet })
      if (platformWalletCode && platformWalletCode !== '0x') {
        console.log(`⚠️  Platform wallet appears to be a contract (has bytecode)`)
        console.log(`   This might cause issues with token transfers`)
      } else {
        console.log(`✅ Platform wallet is an EOA (Externally Owned Account)`)
      }
    } catch (error) {
      console.log(`❌ Error checking platform wallet type: ${error.message}`)
    }
    
    console.log('\n✅ Platform wallet check completed!')
    
  } catch (error) {
    console.error('❌ Platform wallet check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkPlatformWalletIssues()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkPlatformWalletIssues }
