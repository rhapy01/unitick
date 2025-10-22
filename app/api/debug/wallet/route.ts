import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { getSecureWalletForUser } from '@/lib/wallet-secure'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
})

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address, email, wallet_salt')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get wallet using the secure wallet system
    const walletData = await getSecureWalletForUser(user.id, profile.email)
    
    // Check ETH balance
    const ethBalance = await publicClient.getBalance({
      address: walletData.address as `0x${string}`
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        profileWalletAddress: profile.wallet_address,
        derivedWalletAddress: walletData.address,
        addressesMatch: profile.wallet_address.toLowerCase() === walletData.address.toLowerCase(),
        ethBalanceWei: ethBalance.toString(),
        ethBalanceEth: (Number(ethBalance) / 1e18).toFixed(6),
        minRequiredWei: '1000000000000000', // 0.001 ETH
        minRequiredEth: '0.001',
        hasEnoughEth: ethBalance >= BigInt('1000000000000000'),
        userEmail: profile.email,
        userId: user.id,
        walletSalt: profile.wallet_salt,
        explanation: {
          issue: profile.wallet_address.toLowerCase() !== walletData.address.toLowerCase() ? 'Wallet address mismatch' : ethBalance < BigInt('1000000000000000') ? 'Insufficient ETH' : 'No issues detected',
          solution: profile.wallet_address.toLowerCase() !== walletData.address.toLowerCase() ? 'You need to either: 1) Import the derived wallet into MetaMask, or 2) Update your profile to use your current wallet' : ethBalance < BigInt('1000000000000000') ? 'Add ETH to your wallet' : 'Everything looks good'
        }
      }
    })

  } catch (error) {
    console.error('[Debug] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
