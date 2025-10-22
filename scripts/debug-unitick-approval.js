#!/usr/bin/env node

/**
 * Debug script to test UniTick approval directly
 * This will help us understand why the approval isn't working
 */

const { createPublicClient, http, createWalletClient, privateKeyToAccount, parseAbi, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract addresses
const UNITICK_CONTRACT_ADDRESS = "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7"
const UNILABOOK_CONTRACT_ADDRESS = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
const USER_WALLET = "0x9C0ec60bDEeF0B8D8FDca3D2a137078D68F454Bb"
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// ERC20 ABI
const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
])

async function debugUniTickApproval() {
  console.log('🔍 DEBUGGING UNITICK APPROVAL')
  console.log('=' .repeat(50))
  console.log(`User Wallet: ${USER_WALLET}`)
  console.log(`UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
  console.log(`UnilaBook Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
  console.log('')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
  })

  try {
    // Step 1: Check contract info
    console.log('1️⃣ CHECKING CONTRACT INFO')
    console.log('=' .repeat(30))
    
    try {
      const name = await publicClient.readContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'name'
      })
      const symbol = await publicClient.readContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'symbol'
      })
      const decimals = await publicClient.readContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals'
      })
      
      console.log(`✅ Contract Name: ${name}`)
      console.log(`✅ Contract Symbol: ${symbol}`)
      console.log(`✅ Contract Decimals: ${decimals}`)
    } catch (error) {
      console.log(`❌ Error reading contract info: ${error.message}`)
    }
    
    console.log('')

    // Step 2: Check current state
    console.log('2️⃣ CHECKING CURRENT STATE')
    console.log('=' .repeat(30))
    
    const balance = await publicClient.readContract({
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
    
    console.log(`✅ User Balance: ${balance.toString()} wei (${(Number(balance) / 1e18).toFixed(2)} tokens)`)
    console.log(`✅ Current Allowance: ${allowance.toString()} wei (${(Number(allowance) / 1e18).toFixed(2)} tokens)`)
    console.log('')

    // Step 3: Test approval with a small amount first
    console.log('3️⃣ TESTING APPROVAL')
    console.log('=' .repeat(30))
    
    const privateKeyRaw = process.env.PRIVATE_KEYS
    if (!privateKeyRaw) {
      console.log('❌ PRIVATE_KEYS not set - cannot test approval')
      console.log('')
      console.log('💡 To test approval, set PRIVATE_KEYS environment variable')
      console.log('   with the private key for wallet:', USER_WALLET)
      return
    }
    
    const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`
    const account = privateKeyToAccount(privateKey)
    
    if (account.address.toLowerCase() !== USER_WALLET.toLowerCase()) {
      console.log(`❌ Private key doesn't match user wallet`)
      console.log(`   Expected: ${USER_WALLET}`)
      console.log(`   Got: ${account.address}`)
      return
    }
    
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL)
    })
    
    // Test with a small amount first
    const testAmount = parseEther('1') // 1 token
    
    console.log(`🔐 Testing approval with ${testAmount.toString()} wei (1 token)...`)
    
    try {
      const hash = await walletClient.writeContract({
        address: UNITICK_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [UNILABOOK_CONTRACT_ADDRESS, testAmount],
        account
      })
      
      console.log(`✅ Approval transaction sent: ${hash}`)
      console.log('⏳ Waiting for confirmation...')
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        console.log('✅ Approval transaction confirmed')
        
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Check new allowance
        const newAllowance = await publicClient.readContract({
          address: UNITICK_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [USER_WALLET, UNILABOOK_CONTRACT_ADDRESS]
        })
        
        console.log(`✅ New Allowance: ${newAllowance.toString()} wei`)
        console.log(`✅ Expected: ${testAmount.toString()} wei`)
        console.log(`✅ Match: ${newAllowance.toString() === testAmount.toString()}`)
        
        if (newAllowance.toString() === testAmount.toString()) {
          console.log('')
          console.log('🎉 APPROVAL IS WORKING!')
          console.log('   The issue might be with the amount or timing in the main approval.')
        } else {
          console.log('')
          console.log('❌ APPROVAL NOT WORKING')
          console.log('   The UniTick contract might have an issue with approvals.')
        }
        
      } else {
        console.log(`❌ Approval failed with status: ${receipt.status}`)
      }
      
    } catch (approvalError) {
      console.error('❌ Approval failed:', approvalError.message)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the debug
debugUniTickApproval()
  .then(() => {
    console.log('')
    console.log('✅ Debug completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  })
