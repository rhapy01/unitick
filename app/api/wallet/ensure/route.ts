import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecureWalletForUser, getSecureWalletForUser } from '@/lib/wallet-secure'

export async function POST(request: NextRequest) {
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

    // Get user profile (no wallet columns exist anymore)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Since we cleaned the database, all users need new wallets
    // Create new secure encrypted wallet
    const walletAddress = await createSecureWalletForUser(user.id, profile.email)
    
    return NextResponse.json({
      success: true,
      walletAddress: walletAddress,
      isNewWallet: true,
      isEncrypted: true,
      message: 'Secure encrypted wallet created successfully'
    })

  } catch (error) {
    console.error('[API] Error in wallet creation endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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

    // Since we cleaned the database, no wallet columns exist
    return NextResponse.json({
      success: true,
      walletAddress: null,
      walletConnectedAt: null,
      walletType: 'auto_generated',
      hasWallet: false,
      isEncrypted: false,
      securityLevel: 'unknown'
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