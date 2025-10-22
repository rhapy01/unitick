import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUniTickBalance, getUniTickAllowance } from '@/lib/contract-client'
import { getUnilaBookAddress } from '@/lib/addresses'
import { getSecureWalletForUser } from '@/lib/wallet-secure'

export async function GET(request: NextRequest) {
  console.log('[Token Status API] Getting token status...')
  
  try {
    // Get user from auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Token Status API] Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('[Token Status API] No user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }
    
    console.log('[Token Status API] User authenticated:', user.id)
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, wallet_address')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Token Status API] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    if (!profile) {
      console.error('[Token Status API] No profile found for user:', user.id)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.wallet_address) {
      console.error('[Token Status API] No wallet address found for user:', user.id)
      return NextResponse.json(
        { error: 'No wallet found. Please create a wallet first.' },
        { status: 400 }
      )
    }
    
    console.log('[Token Status API] Profile loaded successfully:', { 
      email: profile.email, 
      walletAddress: profile.wallet_address 
    })

    // Get wallet for checking balance
    console.log('[Token Status API] Getting secure wallet...')
    const walletData = await getSecureWalletForUser(user.id, profile.email)
    console.log('[Token Status API] Wallet data retrieved:', { address: walletData.address })
    
    // Check current balance and allowance
    console.log('[Token Status API] Checking token balance and allowance...')
    const contractAddress = getUnilaBookAddress()
    console.log('[Token Status API] Contract address:', contractAddress)
    
    const currentBalance = await getUniTickBalance(walletData.address)
    const currentAllowance = await getUniTickAllowance(walletData.address, contractAddress)
    
    console.log('[Token Status API] Token status retrieved:', {
      balance: currentBalance.toString(),
      allowance: currentAllowance.toString()
    })
    
    return NextResponse.json({
      success: true,
      walletAddress: walletData.address,
      contractAddress: contractAddress,
      balance: currentBalance.toString(),
      allowance: currentAllowance.toString(),
      balanceFormatted: (Number(currentBalance) / 1e18).toFixed(6),
      allowanceFormatted: (Number(currentAllowance) / 1e18).toFixed(6)
    })

  } catch (error) {
    console.error('[Token Status API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get token status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
