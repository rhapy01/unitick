#!/usr/bin/env node

/**
 * Script to approve UniTick tokens for the UnilaBook contract
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, createWalletClient, http, parseEther, maxUint256 } = require('viem')
const { baseSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

// ERC20 ABI
const ERC20_ABI = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
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

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'
const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'

async function approveTokens() {
  try {
    console.log('🔍 Approving UniTick tokens for UnilaBook contract...\n')
    
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
    
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http()
    })
    
    console.log(`📋 UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
    console.log(`📋 UnilaBook Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
    console.log(`👤 Account: ${account.address}`)
    
    // Check current allowance
    console.log('\n1️⃣ Checking current allowance...')
    console.log('=' .repeat(50))
    
    const currentAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account.address, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Current Allowance: ${currentAllowance.toString()} wei`)
    
    if (currentAllowance > 0) {
      console.log(`✅ Allowance already exists, no need to approve`)
      return
    }
    
    // Approve maximum amount
    console.log('\n2️⃣ Approving maximum amount...')
    console.log('=' .repeat(50))
    
    const approveAmount = maxUint256 // Approve maximum amount
    
    try {
      const hash = await walletClient.writeContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNILABOOK_CONTRACT_ADDRESS, approveAmount],
        account
      })
      
      console.log(`✅ Approval transaction sent: ${hash}`)
      
      // Wait for transaction to be mined
      console.log(`⏳ Waiting for transaction to be mined...`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        console.log(`✅ Approval successful!`)
        
        // Check new allowance
        const newAllowance = await publicClient.readContract({
          address: UNITICK_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [account.address, UNILABOOK_CONTRACT_ADDRESS]
        })
        
        console.log(`✅ New Allowance: ${newAllowance.toString()} wei`)
        
      } else {
        console.log(`❌ Approval failed with status: ${receipt.status}`)
      }
      
    } catch (approveError) {
      console.log(`❌ Approval failed: ${approveError.message}`)
    }
    
    console.log('\n✅ Token approval completed!')
    
  } catch (error) {
    console.error('❌ Token approval failed:', error.message)
    process.exit(1)
  }
}

// Run the approval
if (require.main === module) {
  approveTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { approveTokens }
