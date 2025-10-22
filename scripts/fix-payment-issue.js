#!/usr/bin/env node

/**
 * Comprehensive fix for the payment approval issue
 * This script will:
 * 1. Check the user's current status
 * 2. Approve tokens if needed
 * 3. Test the payment flow
 */

const { createPublicClient, http, createWalletClient, privateKeyToAccount, parseEther, maxUint256 } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract addresses
const UNITICK_CONTRACT_ADDRESS = "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7"
const UNILABOOK_CONTRACT_ADDRESS = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// User's actual wallet address
const USER_WALLET = "0x9C0ec60bDEeF0B8D8FDca3D2a137078D68F454Bb"

// ERC20 ABI
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
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

async function fixPaymentIssue() {
  console.log('🔧 COMPREHENSIVE PAYMENT FIX')
  console.log('=' .repeat(60))
  console.log(`User Wallet: ${USER_WALLET}`)
  console.log(`UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
  console.log(`UnilaBook Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
  console.log('')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
  })

  try {
    // Step 1: Check current status
    console.log('1️⃣ CHECKING CURRENT STATUS')
    console.log('=' .repeat(40))
    
    const ethBalance = await publicClient.getBalance({ address: USER_WALLET })
    const utickBalance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [USER_WALLET]
    })
    const allowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [USER_WALLET, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    const requiredAmount = parseEther('130.65')
    
    console.log(`✅ ETH Balance: ${ethBalance.toString()} wei (${(Number(ethBalance) / 1e18).toFixed(6)} ETH)`)
    console.log(`✅ UTICK Balance: ${utickBalance.toString()} wei (${(Number(utickBalance) / 1e18).toFixed(2)} UTICK)`)
    console.log(`✅ Current Allowance: ${allowance.toString()} wei (${(Number(allowance) / 1e18).toFixed(2)} UTICK)`)
    console.log(`✅ Required Amount: ${requiredAmount.toString()} wei (130.65 UTICK)`)
    console.log('')
    
    // Check if everything is sufficient
    const hasEnoughETH = ethBalance >= parseEther('0.001') // Minimum for gas
    const hasEnoughUTICK = utickBalance >= requiredAmount
    const hasEnoughAllowance = allowance >= requiredAmount
    
    console.log(`📊 STATUS CHECK:`)
    console.log(`   ETH Sufficient: ${hasEnoughETH ? '✅ YES' : '❌ NO'}`)
    console.log(`   UTICK Sufficient: ${hasEnoughUTICK ? '✅ YES' : '❌ NO'}`)
    console.log(`   Allowance Sufficient: ${hasEnoughAllowance ? '✅ YES' : '❌ NO'}`)
    console.log('')
    
    if (hasEnoughETH && hasEnoughUTICK && hasEnoughAllowance) {
      console.log('🎉 ALL CHECKS PASSED!')
      console.log('   The user has everything needed for payment.')
      console.log('   The payment should work now.')
      console.log('')
      console.log('💡 If payment still fails, the issue might be:')
      console.log('   1. Vendor whitelist status')
      console.log('   2. Contract logic error')
      console.log('   3. Gas estimation issues')
      console.log('   4. Network congestion')
      return
    }
    
    // Step 2: Fix allowance if needed
    if (!hasEnoughAllowance) {
      console.log('2️⃣ FIXING ALLOWANCE')
      console.log('=' .repeat(40))
      
      const privateKeyRaw = process.env.PRIVATE_KEYS
      if (!privateKeyRaw) {
        console.log('❌ Cannot fix allowance - PRIVATE_KEYS not set')
        console.log('')
        console.log('💡 SOLUTIONS:')
        console.log('   1. Set PRIVATE_KEYS environment variable with user\'s private key')
        console.log('   2. Use the web interface to approve tokens')
        console.log('   3. Ask the user to manually approve tokens')
        console.log('')
        console.log('🔧 MANUAL APPROVAL INSTRUCTIONS:')
        console.log('   The user needs to approve the UnilaBook contract to spend their UTICK tokens.')
        console.log(`   Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
        console.log(`   Amount: At least 130.65 UTICK (or maximum for future transactions)`)
        return
      }
      
      const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`
      const account = privateKeyToAccount(privateKey)
      
      if (account.address.toLowerCase() !== USER_WALLET.toLowerCase()) {
        console.log(`❌ Private key doesn't match user wallet`)
        console.log(`   Expected: ${USER_WALLET}`)
        console.log(`   Got: ${account.address}`)
        console.log('')
        console.log('💡 You need the private key for the correct wallet address.')
        return
      }
      
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(RPC_URL)
      })
      
      console.log('🔐 Approving maximum amount for future transactions...')
      
      try {
        const hash = await walletClient.writeContract({
          address: UNITICK_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [UNILABOOK_CONTRACT_ADDRESS, maxUint256],
          account
        })
        
        console.log(`✅ Approval transaction sent: ${hash}`)
        console.log('⏳ Waiting for confirmation...')
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        
        if (receipt.status === 'success') {
          console.log('✅ Approval successful!')
          
          // Verify new allowance
          const newAllowance = await publicClient.readContract({
            address: UNITICK_CONTRACT_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [USER_WALLET, UNILABOOK_CONTRACT_ADDRESS]
          })
          
          console.log(`✅ New Allowance: ${newAllowance.toString()} wei`)
          console.log(`✅ Sufficient: ${newAllowance >= requiredAmount}`)
          
        } else {
          console.log(`❌ Approval failed with status: ${receipt.status}`)
          return
        }
        
      } catch (approvalError) {
        console.error('❌ Approval failed:', approvalError.message)
        return
      }
    }
    
    console.log('')
    console.log('3️⃣ FINAL STATUS CHECK')
    console.log('=' .repeat(40))
    
    // Final check
    const finalAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [USER_WALLET, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Final Allowance: ${finalAllowance.toString()} wei`)
    console.log(`✅ Required: ${requiredAmount.toString()} wei`)
    console.log(`✅ Sufficient: ${finalAllowance >= requiredAmount}`)
    
    if (finalAllowance >= requiredAmount) {
      console.log('')
      console.log('🎉 PAYMENT ISSUE FIXED!')
      console.log('   The user now has sufficient allowance.')
      console.log('   Payment should work now.')
      console.log('')
      console.log('✅ NEXT STEPS:')
      console.log('   1. Retry the payment transaction')
      console.log('   2. The payment should complete successfully')
      console.log('   3. If it still fails, check vendor whitelist status')
    } else {
      console.log('')
      console.log('❌ ALLOWANCE STILL INSUFFICIENT')
      console.log('   Something went wrong with the approval process.')
      console.log('   Please check the transaction logs.')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the fix
fixPaymentIssue()
  .then(() => {
    console.log('')
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
