#!/usr/bin/env node

/**
 * Script to approve UTICK tokens for the actual user wallet
 * This will fix the insufficient allowance issue
 */

const { createPublicClient, http, createWalletClient, privateKeyToAccount, parseEther, maxUint256 } = require('viem')
const { baseSepolia } = require('viem/chains')

// Contract addresses
const UNITICK_CONTRACT_ADDRESS = "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7"
const UNILABOOK_CONTRACT_ADDRESS = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'

// User's actual wallet address
const USER_WALLET = "0x9C0ec60bDEeF0B8D8FDca3D2a137078D68F454Bb"

// ERC20 ABI for approval
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

async function approveTokensForUser() {
  console.log('🔐 Approving UTICK tokens for user wallet...')
  console.log(`User Wallet: ${USER_WALLET}`)
  console.log(`UniTick Contract: ${UNITICK_CONTRACT_ADDRESS}`)
  console.log(`UnilaBook Contract: ${UNILABOOK_CONTRACT_ADDRESS}`)
  console.log('')

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
  })

  try {
    // Check current allowance
    console.log('1️⃣ Checking current allowance...')
    console.log('=' .repeat(50))
    
    const currentAllowance = await publicClient.readContract({
      address: UNITICK_CONTRACT_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [USER_WALLET, UNILABOOK_CONTRACT_ADDRESS]
    })
    
    console.log(`✅ Current Allowance: ${currentAllowance.toString()} wei`)
    
    if (currentAllowance > 0) {
      console.log(`✅ Allowance already exists!`)
      console.log(`   Current: ${currentAllowance.toString()} wei`)
      console.log(`   Required: ${parseEther('130.65').toString()} wei`)
      console.log(`   Sufficient: ${currentAllowance >= parseEther('130.65')}`)
      
      if (currentAllowance >= parseEther('130.65')) {
        console.log('🎉 User already has sufficient allowance! Payment should work.')
        return
      }
    }
    
    console.log('')

    // Get private key from environment
    const privateKeyRaw = process.env.PRIVATE_KEYS
    if (!privateKeyRaw) {
      console.log('❌ PRIVATE_KEYS environment variable not set.')
      console.log('💡 To approve tokens, you need to:')
      console.log('   1. Set PRIVATE_KEYS environment variable with the user\'s private key')
      console.log('   2. Or use the web interface to approve tokens')
      console.log('   3. Or ask the user to approve tokens manually')
      console.log('')
      console.log('🔧 Alternative solutions:')
      console.log('   - Use the payment page which should auto-approve')
      console.log('   - Check why the auto-approval is failing')
      console.log('   - Use a different wallet that already has approval')
      return
    }
    
    const privateKey = privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`
    const account = privateKeyToAccount(privateKey)
    
    if (account.address.toLowerCase() !== USER_WALLET.toLowerCase()) {
      console.log(`❌ Private key doesn't match user wallet address.`)
      console.log(`   Expected: ${USER_WALLET}`)
      console.log(`   Got: ${account.address}`)
      console.log('')
      console.log('💡 This means the PRIVATE_KEYS environment variable contains a different wallet\'s private key.')
      console.log('   You need the private key for wallet:', USER_WALLET)
      return
    }
    
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL)
    })
    
    // Approve maximum amount (safer than exact amount)
    console.log('2️⃣ Approving maximum amount...')
    console.log('=' .repeat(50))
    
    const approveAmount = maxUint256 // Approve maximum amount for future transactions
    
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
      console.log('⏳ Waiting for transaction to be mined...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success') {
        console.log('✅ Tokens approved successfully!')
        
        // Check new allowance
        const newAllowance = await publicClient.readContract({
          address: UNITICK_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [USER_WALLET, UNILABOOK_CONTRACT_ADDRESS]
        })
        
        console.log(`✅ New allowance: ${newAllowance.toString()} wei`)
        console.log(`✅ Required: ${parseEther('130.65').toString()} wei`)
        console.log(`✅ Sufficient: ${newAllowance >= parseEther('130.65')}`)
        
        console.log('')
        console.log('🎉 SUCCESS! The user now has sufficient allowance for the payment.')
        console.log('   You can now retry the payment transaction.')
        
      } else {
        console.log(`❌ Transaction failed with status: ${receipt.status}`)
      }

    } catch (approvalError) {
      console.error('❌ Approval transaction failed:', approvalError.message)
      
      if (approvalError.message.includes('insufficient funds')) {
        console.log('')
        console.log('💡 The wallet has insufficient ETH for gas fees.')
        console.log('   Current ETH balance might be too low for the approval transaction.')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the approval
approveTokensForUser()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
