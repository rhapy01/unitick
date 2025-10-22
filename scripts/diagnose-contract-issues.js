#!/usr/bin/env node

/**
 * Comprehensive contract diagnostic script
 * Checks all potential causes of transaction reversion
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, createWalletClient, http, formatEther, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

// Contract ABIs
const UNILABOOK_ABI = [
  {
    "inputs": [{"name": "vendor", "type": "address"}],
    "name": "whitelistedVendors",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
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
  },
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

// Contract addresses
const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'

// Test data from the payment logs
const TEST_VENDOR = '0x43606235E11641EFa7a45190aFB9e4cf9b0146eE'
const BUYER_ADDRESS = '0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88'
const PAYMENT_AMOUNT = parseEther('100') // 100 tokens
const PLATFORM_FEE_AMOUNT = parseEther('0.5') // 0.5 tokens
const TOTAL_AMOUNT = parseEther('100.5') // 100.5 tokens

async function diagnoseContractIssues() {
  try {
    console.log('🔍 Comprehensive Contract Diagnostic\n')
    
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
    
    console.log(`📋 Contract Address: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`👤 Account Address: ${account.address}`)
    console.log(`🛒 Buyer Address: ${BUYER_ADDRESS}`)
    console.log(`🏪 Vendor Address: ${TEST_VENDOR}`)
    console.log(`💰 Payment Amount: ${formatEther(PAYMENT_AMOUNT)} UniTick`)
    console.log(`💸 Platform Fee: ${formatEther(PLATFORM_FEE_AMOUNT)} UniTick`)
    console.log(`📊 Total Amount: ${formatEther(TOTAL_AMOUNT)} UniTick\n`)
    
    // 1. Check contract configuration
    console.log('1️⃣ Contract Configuration:')
    console.log('=' .repeat(50))
    
    try {
      const platformWallet = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'platformWallet'
      })
      console.log(`✅ Platform Wallet: ${platformWallet}`)
      
      if (platformWallet === '0x0000000000000000000000000000000000000000') {
        console.log('❌ ERROR: Platform wallet is zero address!')
      }
    } catch (error) {
      console.log(`❌ Failed to get platform wallet: ${error.message}`)
    }
    
    try {
      const platformFeeBps = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'platformFeeBps'
      })
      console.log(`✅ Platform Fee: ${platformFeeBps} bps (${Number(platformFeeBps)/100}%)`)
    } catch (error) {
      console.log(`❌ Failed to get platform fee: ${error.message}`)
    }
    
    try {
      const uniTickTokenAddress = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'uniTickToken'
      })
      console.log(`✅ UniTick Token Address: ${uniTickTokenAddress}`)
    } catch (error) {
      console.log(`❌ Failed to get UniTick token address: ${error.message}`)
    }
    
    // 2. Check vendor whitelist status
    console.log('\n2️⃣ Vendor Whitelist Status:')
    console.log('=' .repeat(50))
    
    try {
      const isWhitelisted = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'whitelistedVendors',
        args: [TEST_VENDOR]
      })
      
      if (isWhitelisted) {
        console.log(`✅ Vendor ${TEST_VENDOR} is WHITELISTED`)
      } else {
        console.log(`❌ Vendor ${TEST_VENDOR} is NOT WHITELISTED`)
      }
    } catch (error) {
      console.log(`❌ Failed to check vendor whitelist: ${error.message}`)
    }
    
    // 3. Check token balances and allowances
    console.log('\n3️⃣ Token Balances & Allowances:')
    console.log('=' .repeat(50))
    
    try {
      const uniTickTokenAddress = await publicClient.readContract({
        address: UNILABOOK_CONTRACT_ADDRESS,
        abi: UNILABOOK_ABI,
        functionName: 'uniTickToken'
      })
      
      // Check buyer balance
      const buyerBalance = await publicClient.readContract({
        address: uniTickTokenAddress,
        abi: UNITICK_ABI,
        functionName: 'balanceOf',
        args: [BUYER_ADDRESS]
      })
      console.log(`✅ Buyer Balance: ${formatEther(buyerBalance)} UniTick`)
      
      if (buyerBalance < TOTAL_AMOUNT) {
        console.log(`❌ ERROR: Buyer has insufficient tokens! Required: ${formatEther(TOTAL_AMOUNT)}, Available: ${formatEther(buyerBalance)}`)
      }
      
      // Check buyer allowance
      const buyerAllowance = await publicClient.readContract({
        address: uniTickTokenAddress,
        abi: UNITICK_ABI,
        functionName: 'allowance',
        args: [BUYER_ADDRESS, UNILABOOK_CONTRACT_ADDRESS]
      })
      console.log(`✅ Buyer Allowance: ${formatEther(buyerAllowance)} UniTick`)
      
      if (buyerAllowance < TOTAL_AMOUNT) {
        console.log(`❌ ERROR: Buyer has insufficient allowance! Required: ${formatEther(TOTAL_AMOUNT)}, Allowed: ${formatEther(buyerAllowance)}`)
      }
      
      // Check contract balance
      const contractBalance = await publicClient.readContract({
        address: uniTickTokenAddress,
        abi: UNITICK_ABI,
        functionName: 'balanceOf',
        args: [UNILABOOK_CONTRACT_ADDRESS]
      })
      console.log(`✅ Contract Balance: ${formatEther(contractBalance)} UniTick`)
      
      // Check vendor balance
      const vendorBalance = await publicClient.readContract({
        address: uniTickTokenAddress,
        abi: UNITICK_ABI,
        functionName: 'balanceOf',
        args: [TEST_VENDOR]
      })
      console.log(`✅ Vendor Balance: ${formatEther(vendorBalance)} UniTick`)
      
    } catch (error) {
      console.log(`❌ Failed to check token balances: ${error.message}`)
    }
    
    // 4. Check ETH balances for gas
    console.log('\n4️⃣ ETH Balances (for gas fees):')
    console.log('=' .repeat(50))
    
    try {
      const buyerEthBalance = await publicClient.getBalance({ address: BUYER_ADDRESS })
      console.log(`✅ Buyer ETH Balance: ${formatEther(buyerEthBalance)} ETH`)
      
      if (buyerEthBalance < parseEther('0.001')) {
        console.log(`❌ WARNING: Buyer has low ETH balance for gas fees`)
      }
      
    } catch (error) {
      console.log(`❌ Failed to check ETH balances: ${error.message}`)
    }
    
    console.log('\n✅ Diagnostic completed!')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
    process.exit(1)
  }
}

// Run the diagnostic
if (require.main === module) {
  diagnoseContractIssues()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { diagnoseContractIssues }
