#!/usr/bin/env node

/**
 * Script to approve deployer account to spend its own tokens
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, createWalletClient, http, maxUint256 } = require('viem')
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
  }
]

const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'

async function approveDeployerSelf() {
  try {
    console.log('🔍 Approving deployer account to spend its own tokens...\n')
    
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
    
    console.log(`🏗️  Deployer Address: ${account.address}`)
    console.log(`🪙 UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
    
    // Approve maximum amount for self
    console.log('\n🔄 Approving maximum amount for self...')
    console.log('=' .repeat(50))
    
    const approveAmount = maxUint256 // Approve maximum amount
    
    try {
      const hash = await walletClient.writeContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [account.address, approveAmount], // Approve self
        account
      })
      
      console.log(`✅ Self-approval transaction sent: ${hash}`)
      
      // Wait for transaction to be mined
      console.log(`⏳ Waiting for transaction to be mined...`)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        console.log(`✅ Self-approval successful!`)
        console.log(`   The deployer account can now spend its own tokens`)
      } else {
        console.log(`❌ Self-approval failed with status: ${receipt.status}`)
      }
      
    } catch (approveError) {
      console.log(`❌ Self-approval failed: ${approveError.message}`)
    }
    
    console.log('\n✅ Self-approval completed!')
    
  } catch (error) {
    console.error('❌ Self-approval failed:', error.message)
    process.exit(1)
  }
}

// Run the approval
if (require.main === module) {
  approveDeployerSelf()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { approveDeployerSelf }
