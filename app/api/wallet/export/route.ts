import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exportSecureWallet } from '@/lib/wallet-secure'

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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, wallet_address')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!profile.wallet_address) {
      return NextResponse.json(
        { error: 'No wallet found for user' },
        { status: 404 }
      )
    }

    // Use the new secure wallet export system
    try {
      const walletData = await exportSecureWallet(user.id, profile.email)
      
      return NextResponse.json({
        success: true,
        walletAddress: walletData.address,
        privateKey: walletData.privateKey,
        mnemonic: walletData.mnemonic,
        message: 'Wallet exported successfully. Keep this information secure!'
      })
    } catch (exportError) {
      console.error('[API] Error exporting secure wallet:', exportError)
      return NextResponse.json(
        { 
          error: 'Failed to export wallet',
          details: exportError instanceof Error ? exportError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[API] Error exporting wallet:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to export wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}