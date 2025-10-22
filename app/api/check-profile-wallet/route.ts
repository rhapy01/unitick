import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
})

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check ETH balance of the profile wallet address
    const ethBalance = await publicClient.getBalance({
      address: profile.wallet_address as `0x${string}`
    })
    
    return NextResponse.json({
      success: true,
      profileWalletAddress: profile.wallet_address,
      ethBalanceWei: ethBalance.toString(),
      ethBalanceEth: (Number(ethBalance) / 1e18).toFixed(6),
      hasEnoughEth: ethBalance >= BigInt('1000000000000000'), // 0.001 ETH
      message: `Your profile wallet ${profile.wallet_address} has ${(Number(ethBalance) / 1e18).toFixed(6)} ETH`
    })

  } catch (error) {
    console.error('[Profile Wallet Check] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check profile wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
