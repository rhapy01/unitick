#!/usr/bin/env node

/**
 * Simple test to verify UniTick approval is working
 */

const { createPublicClient, http, createWalletClient, privateKeyToAccount, parseAbi, parseEther } = require('viem')
const { baseSepolia } = require('viem/chains')

const UNITICK_ADDRESS = '0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7'
const UNILABOOK_ADDRESS = '0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08'
const USER_ADDRESS = '0x9C0ec60bDEeF0B8D8FDca3D2a137078D68F454Bb'

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
])

async function testApproval() {
  console.log('🧪 TESTING UNITICK APPROVAL')
  console.log('=' .repeat(40))
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org')
  })
  
  // Check current allowance
  const currentAllowance = await publicClient.readContract({
    address: UNITICK_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [USER_ADDRESS, UNILABOOK_ADDRESS]
  })
  
  console.log(`Current allowance: ${currentAllowance.toString()}`)
  
  if (currentAllowance > 0n) {
    console.log('✅ Allowance already exists!')
    console.log(`   Amount: ${currentAllowance.toString()} wei`)
    console.log(`   Formatted: ${(Number(currentAllowance) / 1e18).toFixed(2)} UTICK`)
    return
  }
  
  console.log('❌ No allowance found')
  console.log('')
  console.log('💡 The approval transactions are being sent but not working.')
  console.log('   This suggests either:')
  console.log('   1. The UniTick contract has an issue with approvals')
  console.log('   2. The contract address is wrong')
  console.log('   3. There\'s a timing issue')
  console.log('')
  console.log('🔧 SOLUTIONS:')
  console.log('   1. Check if the UniTick contract is deployed correctly')
  console.log('   2. Verify the contract address')
  console.log('   3. Try approving a different contract')
  console.log('   4. Check if there are any special approval restrictions')
}

testApproval().catch(console.error)
