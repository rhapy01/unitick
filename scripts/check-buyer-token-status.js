#!/usr/bin/env node

/**
 * Script to check the specific buyer's token balance and allowance
 * This helps diagnose the createOrder revert issue
 */

const { createPublicClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract addresses
const UNILABOOK_CONTRACT_ADDRESS = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
const UNITICK_CONTRACT_ADDRESS = "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7"
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// Buyer address from the error
const BUYER_ADDRESS = "0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88"

// ERC20 ABI for balance and allowance checks
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

async function checkBuyerTokenStatus() {
  console.log('🔍 Checking buyer token status...')
  console.log(`Buyer: ${BUYER_ADDRESS}`)
  console.log(`UnilaBook Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
  console.log(`UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
  console.log('')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
  })

  try {
    // Calculate required amount from the error data
    // From the error: amounts are 100, 10, 20 (in ETH units, so 100000000000000000000, 10000000000000000000, 20000000000000000000)
    const amount1 = parseEther('100') // 100 UTICK
    const amount2 = parseEther('10')  // 10 UTICK  
    const amount3 = parseEther('20')  // 20 UTICK
    const subtotal = amount1 + amount2 + amount3
    const platformFee = subtotal * 50n / 10000n // 0.5% platform fee
    const totalRequired = subtotal + platformFee

    console.log('💰 Payment Calculation:')
    console.log(`   Item 1: ${amount1.toString()} wei (100 UTICK)`)
    console.log(`   Item 2: ${amount2.toString()} wei (10 UTICK)`)
    console.log(`   Item 3: ${amount3.toString()} wei (20 UTICK)`)
    console.log(`   Subtotal: ${subtotal.toString()} wei`)
    console.log(`   Platform Fee: ${platformFee.toString()} wei`)
    console.log(`   Total Required: ${totalRequired.toString()} wei`)
    console.log('')

    // Check buyer's token balance
    console.log('1️⃣ Buyer Token Balance:')
    console.log('=' .repeat(50))
    
    const buyerBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [BUYER_ADDRESS]
    })
    
    console.log(`✅ Buyer Balance: ${buyerBalance.toString()} wei`)
    console.log(`✅ Required: ${totalRequired.toString()} wei`)
    console.log(`✅ Sufficient Balance: ${buyerBalance >= totalRequired}`)
    
    if (buyerBalance < totalRequired) {
      console.log(`❌ INSUFFICIENT BALANCE! This could cause the revert.`)
      console.log(`   Shortfall: ${totalRequired - buyerBalance} wei`)
    }
    
    console.log('')

    // Check buyer's allowance
    console.log('2️⃣ Buyer Allowance:')
    console.log('=' .repeat(50))
    
    const buyerAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [BUYER_ADDRESS, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Buyer Allowance: ${buyerAllowance.toString()} wei`)
    console.log(`✅ Required: ${totalRequired.toString()} wei`)
    console.log(`✅ Sufficient Allowance: ${buyerAllowance >= totalRequired}`)
    
    if (buyerAllowance < totalRequired) {
      console.log(`❌ INSUFFICIENT ALLOWANCE! This could cause the revert.`)
      console.log(`   Shortfall: ${totalRequired - buyerAllowance} wei`)
    }
    
    console.log('')

    // Check contract's token balance
    console.log('3️⃣ Contract Token Balance:')
    console.log('=' .repeat(50))
    
    const contractBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Contract Balance: ${contractBalance.toString()} wei`)
    console.log(`✅ Required for vendor payments: ${subtotal.toString()} wei`)
    console.log(`✅ Contract has enough for vendor payments: ${contractBalance >= subtotal}`)
    
    console.log('')

    // Summary
    console.log('📋 Summary:')
    console.log('=' .repeat(50))
    console.log(`Balance Check: ${buyerBalance >= totalRequired ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Allowance Check: ${buyerAllowance >= totalRequired ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Contract Balance: ${contractBalance >= subtotal ? '✅ PASS' : '❌ FAIL'}`)
    
    if (buyerBalance < totalRequired || buyerAllowance < totalRequired) {
      console.log('')
      console.log('🚨 LIKELY CAUSE OF REVERT:')
      if (buyerBalance < totalRequired) {
        console.log('   - Insufficient token balance')
      }
      if (buyerAllowance < totalRequired) {
        console.log('   - Insufficient token allowance')
      }
      console.log('')
      console.log('💡 SOLUTION:')
      console.log('   - Ensure buyer has enough UTICK tokens')
      console.log('   - Approve sufficient allowance for the contract')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the check
checkBuyerTokenStatus()
  .then(() => {
    console.log('✅ Check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
