import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { approveUniTickTokens, getUniTickBalance, getUniTickAllowance, getUnilaBookAddress, getPublicClient } from "@/lib/contract-client"
import { getContractAddress } from "@/lib/addresses"
import { getSecureWalletForUser } from "@/lib/wallet-secure"
import { privateKeyToAccount } from "viem/accounts"
import { createWalletClient, http } from "viem"
import { baseSepolia } from "viem/chains"

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Approval API] Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[Approval API] Uncaught Exception:', error)
})

export async function POST(request: NextRequest) {
  console.log('[Approval API] Starting token approval...')
  
  try {
    const body = await request.json()
    console.log('[Approval API] Request body received:', { 
      hasAmount: !!body.amount,
      amount: body.amount,
      hasUserId: !!body.userId 
    })
    
    const { amount, userId } = body

    if (!amount) {
      console.error('[Approval API] Missing required fields:', { amount: !!amount, userId: !!userId })
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      console.error('[Approval API] Missing required fields:', { amount: !!amount, userId: !!userId })
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    console.log('[Approval API] Verifying user authentication...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Approval API] Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('[Approval API] No user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }
    
    if (user.id !== userId) {
      console.error('[Approval API] User ID mismatch:', { expected: userId, actual: user.id })
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 401 }
      )
    }
    
    console.log('[Approval API] User authenticated successfully:', user.id)

    // Get user's profile
    console.log('[Approval API] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Approval API] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    if (!profile) {
      console.error('[Approval API] No profile found for user:', user.id)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('[Approval API] Profile loaded successfully:', {
      email: profile.email
    })

    // Since we cleaned the database, we need to get the wallet from the secure system
    let secureWallet
    try {
      secureWallet = await getSecureWalletForUser(user.id, profile.email)
    } catch (error) {
      console.log('[Approval API] No secure wallet found - user needs to create wallet')
      return NextResponse.json({
        error: 'No wallet found. Please create a wallet first.',
        details: 'Your wallet needs to be set up. Please go to the wallet management page to create a new wallet.',
        needsWalletCreation: true
      }, { status: 400 })
    }

    // Check if user has encrypted wallet (this will fail since columns don't exist)
    console.log('[Approval API] Checking wallet encryption status...')
    const { data: walletProfile, error: walletError } = await supabase
      .from('profiles')
      .select('wallet_encrypted_private_key')
      .eq('id', user.id)
      .single()
    
    if (walletError || !walletProfile) {
      console.log('[Approval API] No encrypted wallet found - user needs to create wallet')
      return NextResponse.json({
        error: 'No encrypted wallet found. Please create a wallet first.',
        details: 'Your wallet needs to be set up with proper encryption. Please go to the wallet management page to create a new wallet.',
        needsWalletCreation: true
      }, { status: 400 })
    }

    if (!walletProfile.wallet_encrypted_private_key) {
      console.log('[Approval API] No encrypted wallet found - user needs to create wallet')
      return NextResponse.json({
        error: 'No encrypted wallet found. Please create a wallet first.',
        details: 'Your wallet needs to be set up with proper encryption. Please go to the wallet management page to create a new wallet.',
        needsWalletCreation: true
      }, { status: 400 })
    }

    // Get wallet for approval
    console.log('[Approval API] Getting secure wallet...')
    const walletData = await getSecureWalletForUser(user.id, profile.email)
    console.log('[Approval API] Wallet data retrieved:', { address: walletData.address })

    // Create account from private key
    const account = privateKeyToAccount(walletData.privateKey as `0x${string}`)
    
    // Create wallet client with the decrypted private key
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
    })

    // Check if wallet has enough UniTick tokens
    console.log('[Approval API] Checking UniTick token balance...')
    const approvalAmount = BigInt(amount)
    const tokenBalance = await getUniTickBalance(walletData.address)
    console.log('[Approval API] Current token balance:', tokenBalance.toString())
    console.log('[Approval API] Required for approval:', approvalAmount.toString())
    
    if (tokenBalance < approvalAmount) {
      console.error('[Approval API] Insufficient token balance:', {
        balance: tokenBalance.toString(),
        required: approvalAmount.toString()
      })
      return NextResponse.json(
        { error: `Insufficient UniTick tokens. Balance: ${tokenBalance.toString()}, Required: ${approvalAmount.toString()}` },
        { status: 400 }
      )
    }

    // Execute the approval transaction
    console.log('[Approval API] Executing approval transaction...')
    console.log('[Approval API] Wallet address for approval:', walletData.address)
    console.log('[Approval API] Contract address:', getUnilaBookAddress())
    console.log('[Approval API] UniTick token address:', getContractAddress("UNITICK"))
    console.log('[Approval API] Approval amount:', approvalAmount.toString())
    
    const hash = await approveUniTickTokens(approvalAmount, walletClient, getUnilaBookAddress())
    console.log('[Approval API] Approval transaction hash:', hash)

    // Wait for transaction confirmation
    console.log('[Approval API] Waiting for transaction confirmation...')
    const publicClient = getPublicClient()
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.log('[Approval API] Transaction confirmed:', receipt.status)

    if (receipt.status !== 'success') {
      console.error('[Approval API] Transaction failed:', receipt)
      return NextResponse.json(
        { error: 'Approval transaction failed' },
        { status: 500 }
      )
    }

    // Wait a moment for blockchain state to update
    console.log('[Approval API] Waiting for blockchain state to update...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verify the new allowance
    console.log('[Approval API] Verifying new allowance...')
    const contractAddress = getUnilaBookAddress()
    console.log('[Approval API] Checking allowance for wallet:', walletData.address)
    console.log('[Approval API] Checking allowance for contract:', contractAddress)
    const newAllowance = await getUniTickAllowance(walletData.address, contractAddress)
    console.log('[Approval API] New allowance:', newAllowance.toString())
    console.log('[Approval API] Expected allowance:', approvalAmount.toString())

    if (newAllowance < approvalAmount) {
      console.error('[Approval API] Allowance verification failed:', {
        new: newAllowance.toString(),
        requested: approvalAmount.toString()
      })
      return NextResponse.json(
        { error: `Approval completed but allowance verification failed. New: ${newAllowance.toString()}, Requested: ${approvalAmount.toString()}` },
        { status: 500 }
      )
    }

    console.log('[Approval API] Approval successful!')
    return NextResponse.json({
      success: true,
      transactionHash: hash,
      allowance: newAllowance.toString(),
      message: 'Token approval completed successfully'
    })

  } catch (error) {
    console.error('[Approval API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('[Approval API] Getting token status...')
  
  try {
    // Add a simple test to ensure the function is being called
    console.log('[Approval API] Function called successfully')
    
    // Test imports first
    console.log('[Approval API] Testing imports...')
    console.log('[Approval API] getUnilaBookAddress:', typeof getUnilaBookAddress)
    console.log('[Approval API] getUniTickBalance:', typeof getUniTickBalance)
    console.log('[Approval API] getUniTickAllowance:', typeof getUniTickAllowance)
    console.log('[Approval API] getSecureWalletForUser:', typeof getSecureWalletForUser)
    
    // If any import is undefined, return early with error
    if (typeof getUnilaBookAddress !== 'function') {
      console.error('[Approval API] getUnilaBookAddress is not a function')
      return NextResponse.json(
        { error: 'getUnilaBookAddress import failed', details: 'Contract client import error' },
        { status: 500 }
      )
    }
    
    if (typeof getUniTickBalance !== 'function') {
      console.error('[Approval API] getUniTickBalance is not a function')
      return NextResponse.json(
        { error: 'getUniTickBalance import failed', details: 'Contract client import error' },
        { status: 500 }
      )
    }
    
    if (typeof getUniTickAllowance !== 'function') {
      console.error('[Approval API] getUniTickAllowance is not a function')
      return NextResponse.json(
        { error: 'getUniTickAllowance import failed', details: 'Contract client import error' },
        { status: 500 }
      )
    }
    
    if (typeof getSecureWalletForUser !== 'function') {
      console.error('[Approval API] getSecureWalletForUser is not a function')
      return NextResponse.json(
        { error: 'getSecureWalletForUser import failed', details: 'Wallet secure import error' },
        { status: 500 }
      )
    }
    
    console.log('[Approval API] All imports are valid functions')
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('[Approval API] Request params:', { userId })

    if (!userId) {
      console.error('[Approval API] Missing userId parameter')
      return NextResponse.json(
        { error: 'User ID is required', details: 'userId query parameter is missing' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    console.log('[Approval API] Verifying user authentication...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Approval API] Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('[Approval API] No user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }
    
    if (user.id !== userId) {
      console.error('[Approval API] User ID mismatch:', { expected: userId, actual: user.id })
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 401 }
      )
    }
    
    console.log('[Approval API] User authenticated successfully:', user.id)

    // Get user's profile
    console.log('[Approval API] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Approval API] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    if (!profile) {
      console.error('[Approval API] No profile found for user:', user.id)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('[Approval API] Profile loaded successfully:', {
      email: profile.email
    })

    // Since we cleaned the database, we need to get the wallet from the secure system
    let secureWallet
    try {
      secureWallet = await getSecureWalletForUser(user.id, profile.email)
    } catch (error) {
      console.log('[Approval API] No secure wallet found - user needs to create wallet')
      return NextResponse.json({
        error: 'No wallet found. Please create a wallet first.',
        details: 'Your wallet needs to be set up. Please go to the wallet management page to create a new wallet.',
        needsWalletCreation: true
      }, { status: 400 })
    }

    // Get wallet balances and allowance using the secure wallet
    console.log('[Approval API] Getting wallet balances and allowance...')
    
    const walletAddress = secureWallet.address
    console.log('[Approval API] Wallet address:', walletAddress)
    
    let contractAddress
    try {
      contractAddress = getUnilaBookAddress()
      console.log('[Approval API] Contract address:', contractAddress)
    } catch (error) {
      console.error('[Approval API] Error getting contract address:', error)
      return NextResponse.json(
        { error: 'Failed to get contract address', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    // Get UniTick balance
    let balance
    try {
      console.log('[Approval API] Getting UniTick balance...')
      balance = await getUniTickBalance(walletAddress)
      console.log('[Approval API] Raw balance:', balance.toString())
    } catch (error) {
      console.error('[Approval API] Error getting balance:', error)
      return NextResponse.json(
        { error: 'Failed to get token balance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    const balanceFormatted = (Number(balance) / 1e18).toFixed(6)
    
    // Get current allowance
    let allowance
    try {
      console.log('[Approval API] Getting UniTick allowance...')
      allowance = await getUniTickAllowance(walletAddress, contractAddress)
      console.log('[Approval API] Raw allowance:', allowance.toString())
    } catch (error) {
      console.error('[Approval API] Error getting allowance:', error)
      return NextResponse.json(
        { error: 'Failed to get token allowance', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    const allowanceFormatted = (Number(allowance) / 1e18).toFixed(6)
    
    console.log('[Approval API] Wallet status:', {
      walletAddress,
      contractAddress,
      balance: balanceFormatted,
      allowance: allowanceFormatted
    })
    
    return NextResponse.json({
      success: true,
      walletAddress: walletAddress,
      contractAddress: contractAddress,
      balance: balance.toString(),
      allowance: allowance.toString(),
      balanceFormatted: balanceFormatted,
      allowanceFormatted: allowanceFormatted,
      needsWalletCreation: false
    })

  } catch (error) {
    console.error('[Approval API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}