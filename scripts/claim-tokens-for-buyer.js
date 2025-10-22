#!/usr/bin/env node

/**
 * Script to claim UTICK tokens from the faucet for the buyer
 * This will solve the insufficient balance issue
 */

const { createPublicClient, http, createWalletClient, privateKeyToAccount } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract addresses
const UNITICK_CONTRACT_ADDRESS = "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7"
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// Buyer address from the error
const BUYER_ADDRESS = "0xf46C23f552eFaAF15e5d0C5330084732A6EfcA88"

// UniTick contract ABI for faucet function
const UNITICK_ABI = [
  {
    "inputs": [],
    "name": "claimFaucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "canClaim",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "timeUntilNextClaim",
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
  }
]

async function claimTokensForBuyer() {
  console.log('🚰 Claiming UTICK tokens from faucet...')
  console.log(`Buyer: ${BUYER_ADDRESS}`)
  console.log(`UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
  console.log('')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
  })

  try {
    // Check if buyer can claim tokens
    console.log('1️⃣ Checking faucet eligibility...')
    console.log('=' .repeat(50))
    
    const canClaim = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: UNITICK_ABI,
      functionName: 'canClaim',
      args: [BUYER_ADDRESS]
    })
    
    console.log(`✅ Can claim tokens: ${canClaim}`)
    
    if (!canClaim) {
      const timeUntilNext = await publicClient.readContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: UNITICK_ABI,
        functionName: 'timeUntilNextClaim',
        args: [BUYER_ADDRESS]
      })
      
      const hoursUntilNext = Number(timeUntilNext) / 3600
      console.log(`⏰ Time until next claim: ${hoursUntilNext.toFixed(2)} hours`)
      console.log('❌ Cannot claim tokens right now. Please wait or use a different address.')
      return
    }
    
    // Check current balance
    const currentBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: UNITICK_ABI,
      functionName: 'balanceOf',
      args: [BUYER_ADDRESS]
    })
    
    console.log(`✅ Current balance: ${currentBalance.toString()} wei`)
    console.log('')

    // Get private key from environment (you'll need to set this)
    const privateKeyRaw = process.env.PRIVATE_KEYS
    if (!privateKeyRaw) {
      console.log('❌ PRIVATE_KEYS environment variable not set.')
      console.log('💡 To claim tokens, you need to:')
      console.log('   1. Set PRIVATE_KEYS environment variable with the buyer\'s private key')
      console.log('   2. Or manually transfer tokens to the buyer address')
      console.log('   3. Or use a different buyer address that has tokens')
      console.log('')
      console.log('🔧 Alternative: Use the web interface to claim tokens:')
      console.log('   - Go to the dashboard')
      console.log('   - Use the token faucet feature')
      console.log('   - Or ask someone with tokens to transfer to this address')
      return
    }
    
    const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`
    const account = privateKeyToAccount(privateKey)
    
    if (account.address.toLowerCase() !== BUYER_ADDRESS.toLowerCase()) {
      console.log(`❌ Private key doesn't match buyer address.`)
      console.log(`   Expected: ${BUYER_ADDRESS}`)
      console.log(`   Got: ${account.address}`)
      return
    }
    
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL)
    })
    
    console.log('2️⃣ Claiming tokens from faucet...')
    console.log('=' .repeat(50))
    
    // Claim tokens
    const hash = await walletClient.writeContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: UNITICK_ABI,
      functionName: 'claimFaucet',
      account
    })
    
    console.log(`✅ Claim transaction sent: ${hash}`)
    
    // Wait for transaction to be mined
    console.log('⏳ Waiting for transaction to be mined...')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'success') {
      console.log('✅ Tokens claimed successfully!')
      
      // Check new balance
      const newBalance = await publicClient.readContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: UNITICK_ABI,
        functionName: 'balanceOf',
        args: [BUYER_ADDRESS]
      })
      
      console.log(`✅ New balance: ${newBalance.toString()} wei`)
      console.log(`✅ Tokens claimed: ${newBalance - currentBalance} wei`)
      
      console.log('')
      console.log('🎉 SUCCESS! The buyer now has enough tokens for the payment.')
      console.log('   You can now retry the payment transaction.')
      
    } else {
      console.log(`❌ Transaction failed with status: ${receipt.status}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    
    if (error.message.includes('Can only claim once per 24 hours')) {
      console.log('')
      console.log('💡 The buyer has already claimed tokens in the last 24 hours.')
      console.log('   Solutions:')
      console.log('   1. Wait 24 hours and try again')
      console.log('   2. Use a different buyer address')
      console.log('   3. Ask someone with UTICK tokens to transfer to this address')
    }
  }
}

// Run the claim
claimTokensForBuyer()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
