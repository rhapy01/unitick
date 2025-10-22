#!/usr/bin/env node

/**
 * Script to check the approval transaction details
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

const UNITICK_CONTRACT_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'
const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'

async function checkApprovalTransaction() {
  try {
    console.log('🔍 Checking approval transaction details...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    const transactionHash = '0x50d333d185f86e1b952c40d2fb1a669ebe3199587419ea4b401755473b3ed4c8'
    const accountAddress = '0xc0BB2c4424E8a18eF8c6B3e79Fb182937c1f37dE'
    
    console.log(`📋 Transaction Hash: ${transactionHash}`)
    console.log(`👤 Account: ${accountAddress}`)
    
    // Get transaction details
    console.log('\n1️⃣ Transaction Details:')
    console.log('=' .repeat(50))
    
    const transaction = await publicClient.getTransaction({ hash: transactionHash })
    console.log(`✅ From: ${transaction.from}`)
    console.log(`✅ To: ${transaction.to}`)
    console.log(`✅ Value: ${transaction.value.toString()} wei`)
    console.log(`✅ Gas: ${transaction.gas.toString()}`)
    console.log(`✅ Gas Price: ${transaction.gasPrice?.toString()} wei`)
    
    // Get transaction receipt
    console.log('\n2️⃣ Transaction Receipt:')
    console.log('=' .repeat(50))
    
    const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash })
    console.log(`✅ Status: ${receipt.status}`)
    console.log(`✅ Gas Used: ${receipt.gasUsed.toString()}`)
    console.log(`✅ Block Number: ${receipt.blockNumber.toString()}`)
    console.log(`✅ Logs Count: ${receipt.logs.length}`)
    
    // Check logs for Approval event
    console.log('\n3️⃣ Transaction Logs:')
    console.log('=' .repeat(50))
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i]
      console.log(`Log ${i}:`)
      console.log(`   Address: ${log.address}`)
      console.log(`   Topics: ${log.topics.length}`)
      console.log(`   Data: ${log.data}`)
      
      if (log.address.toLowerCase() === UNITICK_CONTRACT_ADDRESS.toLowerCase()) {
        console.log(`   ✅ This is a UniTick token log`)
      }
    }
    
    // Check current allowance again
    console.log('\n4️⃣ Current Allowance Check:')
    console.log('=' .repeat(50))
    
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
    
    const allowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [accountAddress, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Current Allowance: ${allowance.toString()} wei`)
    
    console.log('\n✅ Transaction check completed!')
    
  } catch (error) {
    console.error('❌ Transaction check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
if (require.main === module) {
  checkApprovalTransaction()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { checkApprovalTransaction }
