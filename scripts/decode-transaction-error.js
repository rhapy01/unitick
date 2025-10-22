#!/usr/bin/env node

/**
 * Script to decode the actual error from the transaction
 */

// Load environment variables
require('dotenv').config()

const { createPublicClient, http, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

const UNILABOOK_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS || '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'

async function decodeTransactionError() {
  try {
    console.log('🔍 Decoding transaction error...\n')
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    })
    
    // Get the failed transaction hash from the logs
    const failedTxHash = '0x8c2176913af1613fbaac85a069b62d8a3267e9b4becf6ca494266d06a68ff47a'
    
    console.log(`📋 Failed Transaction: ${failedTxHash}`)
    
    // Get transaction details
    console.log('\n1️⃣ Transaction Details:')
    console.log('=' .repeat(50))
    
    const transaction = await publicClient.getTransaction({ hash: failedTxHash })
    console.log(`✅ From: ${transaction.from}`)
    console.log(`✅ To: ${transaction.to}`)
    console.log(`✅ Value: ${transaction.value.toString()} wei`)
    console.log(`✅ Gas: ${transaction.gas.toString()}`)
    console.log(`✅ Input Data: ${transaction.input}`)
    
    // Get transaction receipt
    console.log('\n2️⃣ Transaction Receipt:')
    console.log('=' .repeat(50))
    
    const receipt = await publicClient.getTransactionReceipt({ hash: failedTxHash })
    console.log(`✅ Status: ${receipt.status}`)
    console.log(`✅ Gas Used: ${receipt.gasUsed.toString()}`)
    console.log(`✅ Block Number: ${receipt.blockNumber.toString()}`)
    
    // Try to call the contract function directly to see the exact error
    console.log('\n3️⃣ Direct Contract Call Test:')
    console.log('=' .repeat(50))
    
    try {
      // Try to simulate the exact call that failed
      const result = await publicClient.call({
        to: UNILABOOK_CONTRACT_ADDRESS,
        data: transaction.input,
        from: transaction.from
      })
      
      console.log(`✅ Call result: ${result}`)
      
    } catch (callError) {
      console.log(`❌ Call failed: ${callError.message}`)
      
      // Try to extract more information from the error
      if (callError.message.includes('0xfb8f41b2')) {
        console.log(`\n🔍 Error Analysis:`)
        console.log(`   Error Signature: 0xfb8f41b2`)
        console.log(`   This is a custom error from the contract`)
        console.log(`   It's not a standard ERC20 or OpenZeppelin error`)
        console.log(`   We need to check the contract source code for custom errors`)
      }
    }
    
    // Check if there are any custom errors in the contract
    console.log('\n4️⃣ Checking for Custom Errors:')
    console.log('=' .repeat(50))
    
    // Let's try to find what 0xfb8f41b2 corresponds to
    // It could be a custom error defined in the contract
    console.log(`🔍 Error signature 0xfb8f41b2 needs to be decoded`)
    console.log(`   This requires checking the contract's custom error definitions`)
    console.log(`   Or using a tool like OpenChain to decode it`)
    
    console.log('\n✅ Error analysis completed!')
    
  } catch (error) {
    console.error('❌ Error analysis failed:', error.message)
    process.exit(1)
  }
}

// Run the analysis
if (require.main === module) {
  decodeTransactionError()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Unhandled error:', error)
      process.exit(1)
    })
}

module.exports = { decodeTransactionError }
