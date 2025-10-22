import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Generate new secure wallet for user
    const { generateSecureWallet } = await import('@/lib/wallet-secure')
    const wallet = await generateSecureWallet(user.id, profile.email)
    
    // Store encrypted wallet data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        wallet_address: wallet.address,
        wallet_encrypted_private_key: wallet.encryptedPrivateKey,
        wallet_encrypted_mnemonic: wallet.encryptedMnemonic,
        wallet_encryption_iv: wallet.iv,
        wallet_encryption_auth_tag: wallet.authTag,
        wallet_mnemonic_iv: wallet.mnemonicIv,
        wallet_mnemonic_auth_tag: wallet.mnemonicAuthTag,
        wallet_encryption_salt: wallet.salt,
        wallet_connected_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile with wallet:', updateError)
      return NextResponse.json(
        { error: 'Failed to save wallet data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet created successfully',
      walletAddress: wallet.address,
      isNewWallet: true
    })

  } catch (error) {
    console.error('[API] Error in wallet migration endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}