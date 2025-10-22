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

    // Validate wallet address format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate UNITICK_ADDRESS is set
    if (!UNITICK_ADDRESS || UNITICK_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE') {
      console.error('[Faucet Check] UNITICK_ADDRESS not configured')
      return NextResponse.json(
        { 
          error: 'Faucet contract not configured',
          details: 'UNITICK_ADDRESS environment variable not set'
        },
        { status: 503 }
      )
    }

    console.log('[Faucet Check] Checking status for wallet:', walletAddress)
    console.log('[Faucet Check] Contract address:', UNITICK_ADDRESS)

    // Check if user can claim
    const canClaim = await publicClient.readContract({
      address: UNITICK_ADDRESS as `0x${string}`,
      abi: unitickAbi,
      functionName: 'canClaim',
      args: [walletAddress as `0x${string}`],
    })

    console.log('[Faucet Check] Can claim result:', canClaim)

    // Get time until next claim if they can't claim
    let timeUntilNextClaim = null
    if (canClaim === false) {
      try {
        timeUntilNextClaim = await publicClient.readContract({
          address: UNITICK_ADDRESS as `0x${string}`,
          abi: unitickAbi,
          functionName: 'timeUntilNextClaim',
          args: [walletAddress as `0x${string}`],
        })
        console.log('[Faucet Check] Time until next claim:', timeUntilNextClaim?.toString())
      } catch (timeError) {
        console.log('[Faucet Check] Could not get time until next claim:', timeError)
        // Not critical, continue without it
      }
    }

    return NextResponse.json({
      success: true,
      canClaim,
      timeUntilNextClaim: timeUntilNextClaim ? timeUntilNextClaim.toString() : null,
    })

  } catch (error) {
    console.log('[API] Error checking faucet status:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to check faucet status',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'The faucet service may be temporarily unavailable. Please try again later.'
      },
      { status: 500 }
    )
  }
}
