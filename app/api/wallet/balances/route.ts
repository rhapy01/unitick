import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UNITICK_ADDRESS } from '@/lib/addresses'
import { unitickAbi } from '@/lib/contract-client'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
})

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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

    // Get user's profile to verify wallet ownership
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

    if (profile.wallet_address !== walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address does not match user profile' },
        { status: 403 }
      )
    }

    // Fetch ETH balance
    const ethBalance = await publicClient.getBalance({
      address: walletAddress as `0x${string}`
    })

    // Fetch UniTick balance
    const unitickBalance = await publicClient.readContract({
      address: UNITICK_ADDRESS as `0x${string}`,
      abi: unitickAbi,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    })

    return NextResponse.json({
      success: true,
      ethBalance: (Number(ethBalance) / 1e18).toFixed(6),
      unitickBalance: (Number(unitickBalance) / 1e18).toFixed(2),
    })

  } catch (error) {
    console.error('[API] Error fetching wallet balances:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallet balances',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
