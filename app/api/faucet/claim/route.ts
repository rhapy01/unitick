import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UNITICK_ADDRESS } from '@/lib/addresses'
import { unitickAbi } from '@/lib/contract-client'
import { createWalletClient, createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
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
        { error: 'Password is required to access your wallet for claiming faucet tokens' },
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
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Since we cleaned the database, we need to create a wallet first
    // Get the secure wallet for the user
    let secureWallet
    try {
      secureWallet = await getSecureWalletForUser(user.id, profile.email)
    } catch (error) {
      return NextResponse.json(
        { error: 'No wallet found. Please create a wallet first.' },
        { status: 400 }
      )
    }

    // Use the secure wallet address for all operations
    const walletAddress = secureWallet.address

    // Check if user can claim
    const canClaim = await publicClient.readContract({
      address: UNITICK_ADDRESS as `0x${string}`,
      abi: unitickAbi,
      functionName: 'canClaim',
      args: [walletAddress as `0x${string}`]
    })

    if (!canClaim) {
      return NextResponse.json(
        { error: 'Cannot claim at this time' },
        { status: 400 }
      )
    }

    // Use the wallet address for balance checks
    const profileWalletAddress = walletAddress
    
    // Check ETH balance for gas fees using the secure wallet address
    const ethBalance = await publicClient.getBalance({
      address: profileWalletAddress as `0x${string}`
    })
    
    console.log('[Faucet] Profile wallet ETH balance:', ethBalance.toString(), 'wei')
    console.log('[Faucet] Profile wallet ETH balance in ETH:', (Number(ethBalance) / 1e18).toFixed(6), 'ETH')
    console.log('[Faucet] Profile wallet address being checked:', profileWalletAddress)
    
    // Check if wallet has enough ETH for gas (minimum 0.001 ETH = 1000000000000000 wei)
    const minGasBalance = BigInt('1000000000000000') // 0.001 ETH
    if (ethBalance < minGasBalance) {
      console.log('[Faucet] Insufficient balance:', {
        current: ethBalance.toString(),
        required: minGasBalance.toString(),
        currentEth: (Number(ethBalance) / 1e18).toFixed(6),
        requiredEth: '0.001'
      })
      
      return NextResponse.json(
        { 
          error: 'Insufficient ETH for gas fees. Please add ETH to your wallet address.',
          walletAddress: profileWalletAddress,
          requiredEth: '0.001 ETH minimum',
          currentBalance: `${(Number(ethBalance) / 1e18).toFixed(6)} ETH`,
          debug: {
            balanceWei: ethBalance.toString(),
            requiredWei: minGasBalance.toString(),
            walletAddress: profileWalletAddress
          }
        },
        { status: 400 }
      )
    }
    
    // Create account from private key using the secure wallet we already retrieved
    const account = privateKeyToAccount(secureWallet.privateKey as `0x${string}`)
    
    // Create wallet client with the decrypted private key
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
    })

    // Execute the claim transaction
    try {
      const hash = await walletClient.writeContract({
        address: UNITICK_ADDRESS as `0x${string}`,
        abi: unitickAbi,
        functionName: 'claimFaucet',
        gas: BigInt('200000'), // Set a reasonable gas limit
      })

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        // Log security event
        await supabase.rpc('log_wallet_security_event', {
          p_user_id: user.id,
          p_action: 'faucet_claimed',
          p_wallet_address: walletAddress,
          p_success: true
        })
        
        return NextResponse.json({
          success: true,
          transactionHash: hash,
          receipt,
        })
      } else {
        return NextResponse.json(
          { error: 'Transaction failed' },
          { status: 500 }
        )
      }
    } catch (txError) {
      console.error('[Faucet] Transaction error:', txError)
      
      // Check if it's a gas-related error
      if (txError instanceof Error) {
        if (txError.message.includes('insufficient funds') || txError.message.includes('gas')) {
          return NextResponse.json(
            { 
              error: 'Insufficient ETH for gas fees. Please add more ETH to your wallet.',
              details: txError.message,
              walletAddress: walletData.address
            },
            { status: 400 }
          )
        }
      }
      
      throw txError // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('[API] Error claiming faucet:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to claim faucet tokens'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees'
        errorDetails = 'Your wallet needs more ETH to cover gas fees for the transaction'
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected'
        errorDetails = 'The transaction was rejected or cancelled'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error'
        errorDetails = 'There was a network issue. Please try again'
      } else if (error.message.includes('contract')) {
        errorMessage = 'Contract error'
        errorDetails = 'There was an issue with the smart contract'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Transaction timeout'
        errorDetails = 'The transaction took too long to complete'
      }
    }
    
    // Log failed security event
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc('log_wallet_security_event', {
          p_user_id: user.id,
          p_action: 'faucet_claim_failed',
          p_success: false,
          p_error_message: errorDetails
        })
      }
    } catch (logError) {
      console.error('[API] Error logging security event:', logError)
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        debug: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    )
  }
}