#!/usr/bin/env node

/**
 * Token Approval Diagnostic Script
 * Helps debug token approval and allowance issues
 */

import { createClient } from '@supabase/supabase-js'
import { getUniTickBalance, getUniTickAllowance, getUnilaBookAddress } from './lib/contract-client.js'
import { getContractAddress } from './lib/addresses.js'
import { getSecureWalletForUser } from './lib/wallet-secure.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseTokenApproval(userId) {
  console.log(`🔍 Diagnosing token approval for user: ${userId}`)
  console.log('=' .repeat(60))

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, wallet_address, wallet_encrypted_private_key')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('❌ User profile not found:', profileError?.message)
      return
    }

    console.log('✅ User profile found')
    console.log(`   Email: ${profile.email}`)
    console.log(`   Wallet Address: ${profile.wallet_address}`)
    console.log(`   Has Encrypted Key: ${!!profile.wallet_encrypted_private_key}`)

    if (!profile.wallet_address) {
      console.error('❌ No wallet address found for user')
      return
    }

    // Get wallet data
    let walletData
    try {
      walletData = await getSecureWalletForUser(userId, profile.email)
      console.log('✅ Wallet data retrieved successfully')
      console.log(`   Decrypted Address: ${walletData.address}`)
      console.log(`   Address Match: ${profile.wallet_address === walletData.address}`)
    } catch (error) {
      console.error('❌ Failed to get wallet data:', error.message)
      return
    }

    // Check contract addresses
    const contractAddress = getUnilaBookAddress()
    const tokenAddress = getContractAddress("UNITICK")
    console.log('\n📋 Contract Information:')
    console.log(`   UnilaBook Contract: ${contractAddress}`)
    console.log(`   UniTick Token: ${tokenAddress}`)

    // Check token balance
    console.log('\n💰 Token Balance Check:')
    try {
      const balance = await getUniTickBalance(walletData.address)
      const balanceFormatted = (Number(balance) / 1e18).toFixed(6)
      console.log(`   Raw Balance: ${balance.toString()}`)
      console.log(`   Formatted: ${balanceFormatted} UNITICK`)
    } catch (error) {
      console.error('❌ Failed to get token balance:', error.message)
    }

    // Check current allowance
    console.log('\n🔐 Allowance Check:')
    try {
      const allowance = await getUniTickAllowance(walletData.address, contractAddress)
      const allowanceFormatted = (Number(allowance) / 1e18).toFixed(6)
      console.log(`   Raw Allowance: ${allowance.toString()}`)
      console.log(`   Formatted: ${allowanceFormatted} UNITICK`)
    } catch (error) {
      console.error('❌ Failed to get allowance:', error.message)
    }

    console.log('\n🎯 Diagnosis Complete!')

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
  }
}

// Get user ID from command line arguments
const userId = process.argv[2]
if (!userId) {
  console.error('Usage: node diagnose-token-approval.js <userId>')
  process.exit(1)
}

diagnoseTokenApproval(userId)
