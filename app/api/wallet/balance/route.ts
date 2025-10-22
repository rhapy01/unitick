import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { UNITICK_ADDRESS } from '@/lib/addresses'
import { unitickAbi } from '@/lib/contract-client'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const token = searchParams.get('token')

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter is required' },
        { status: 400 }
      )
    }

    let balance: string

    if (token === 'ETH') {
      // Get ETH balance
      const ethBalance = await publicClient.getBalance({
        address: address as `0x${string}`
      })
      balance = (Number(ethBalance) / 1e18).toFixed(6)
    } else if (token === 'UNITICK') {
      // Get UniTick token balance
      const unitickBalance = await publicClient.readContract({
        address: UNITICK_ADDRESS as `0x${string}`,
        abi: unitickAbi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      })
      balance = (Number(unitickBalance) / 1e18).toFixed(2)
    } else {
      return NextResponse.json(
        { error: 'Unsupported token type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      balance: balance,
      token: token,
      address: address
    })

  } catch (error) {
    console.error('[Balance API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
