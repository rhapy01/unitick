import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSecureWalletForUser, exportSecureWallet } from '@/lib/wallet-secure'

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
      .select('email, wallet_address, wallet_encrypted_private_key')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!profile.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Check if user already has encrypted wallet
    if (profile.wallet_encrypted_private_key) {
      return NextResponse.json({
        success: false,
        message: 'User already has a secure encrypted wallet',
        isAlreadySecure: true,
        walletAddress: profile.wallet_address
      })
    }

    // Check if user has old unencrypted wallet
    if (profile.wallet_address && !profile.wallet_encrypted_private_key) {
      // User has old wallet - create new secure one
      const newWalletAddress = await createSecureWalletForUser(user.id, profile.email)
      
      // Log security event
      await supabase.rpc('log_wallet_security_event', {
        p_user_id: user.id,
        p_action: 'wallet_regenerated',
        p_wallet_address: newWalletAddress,
        p_success: true
      })

      return NextResponse.json({
        success: true,
        message: 'Wallet successfully regenerated with enhanced security',
        walletAddress: newWalletAddress,
        isNewWallet: true,
        oldWalletAddress: profile.wallet_address,
        migrationCompleted: true
      })
    }

    // User has no wallet - create new one
    const walletAddress = await createSecureWalletForUser(user.id, profile.email)
    
    // Log security event
    await supabase.rpc('log_wallet_security_event', {
      p_user_id: user.id,
      p_action: 'wallet_created',
      p_wallet_address: walletAddress,
      p_success: true
    })

    return NextResponse.json({
      success: true,
      message: 'Secure wallet created successfully',
      walletAddress: walletAddress,
      isNewWallet: true,
      migrationCompleted: false
    })

  } catch (error) {
    console.error('[API] Error regenerating wallet:', error)
    
    // Log failed security event
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc('log_wallet_security_event', {
          p_user_id: user.id,
          p_action: 'wallet_regeneration_failed',
          p_success: false,
          p_error_message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch (logError) {
      console.error('[API] Error logging security event:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to regenerate wallet',
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

    // Get user's wallet information
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('wallet_address, wallet_encrypted_private_key, wallet_security_level, wallet_connected_at')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch wallet information' },
        { status: 500 }
      )
    }

    // Determine wallet status
    const hasWallet = !!profile?.wallet_address
    const isEncrypted = !!profile?.wallet_encrypted_private_key
    const needsMigration = hasWallet && !isEncrypted
    const isSecure = isEncrypted && profile?.wallet_security_level === 'high'

    return NextResponse.json({
      success: true,
      hasWallet,
      isEncrypted,
      needsMigration,
      isSecure,
      walletAddress: profile?.wallet_address || null,
      securityLevel: profile?.wallet_security_level || 'unknown',
      walletConnectedAt: profile?.wallet_connected_at || null,
      canRegenerate: needsMigration || !hasWallet
    })

  } catch (error) {
    console.error('[API] Error checking wallet status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check wallet status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
