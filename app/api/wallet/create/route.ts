import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecureWalletForUser } from '@/lib/wallet-secure'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, password } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      )
    }

    // Verify user exists and is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has a wallet
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', userId)
      .single()

    if (profile?.wallet_address) {
      return NextResponse.json({
        success: true,
        walletAddress: profile.wallet_address,
        message: 'User already has a wallet connected'
      })
    }

    // Generate secure wallet for the user using the new system
    const walletAddress = await createSecureWalletForUser(userId, email)

    return NextResponse.json({
      success: true,
      walletAddress: walletAddress,
      message: 'Wallet created successfully'
    })

  } catch (error) {
    console.error('[API] Error creating wallet:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    // Verify user exists and is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's wallet information
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_connected_at')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch wallet information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      walletAddress: profile?.wallet_address || null,
      walletConnectedAt: profile?.wallet_connected_at || null,
      hasWallet: !!profile?.wallet_address
    })

  } catch (error) {
    console.error('[API] Error fetching wallet:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallet information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
