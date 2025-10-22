import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUnilaBookAddress, isVendorWhitelisted, getUniTickBalance, getUniTickAllowance } from "@/lib/contract-client"
import { getSecureWalletForUser } from "@/lib/wallet-secure"

export async function POST(request: NextRequest) {
  console.log('[Payment Diagnostic] Starting comprehensive payment validation...')
  
  try {
    const body = await request.json()
    const { cartItems, userId } = body

    if (!cartItems || !userId) {
      return NextResponse.json(
        { error: 'Cart items and user ID are required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.wallet_address) {
      return NextResponse.json(
        { error: 'User profile or wallet not found' },
        { status: 404 }
      )
    }

    // Get wallet for checking
    const walletData = await getSecureWalletForUser(user.id, profile.email)
    
    const diagnostics = {
      user: {
        id: user.id,
        email: profile.email,
        walletAddress: walletData.address
      },
      contract: {
        address: getUnilaBookAddress()
      },
      cartItems: {
        count: cartItems.length,
        items: cartItems.map(item => ({
          id: item._id || item.id,
          title: item.listing.title,
          price: item.listing.price,
          quantity: item.quantity,
          vendorId: item.listing.vendor_id,
          vendorWallet: item.listing.vendor?.wallet_address,
          vendorBusinessName: item.listing.vendor?.business_name,
          bookingDate: item.booking_date
        }))
      },
      validation: {
        issues: [],
        warnings: []
      }
    }

    // Check 1: Cart items validation
    if (cartItems.length === 0) {
      diagnostics.validation.issues.push('No cart items found')
    }

    // Check 2: Vendor wallet addresses
    const vendorGroups = new Map<string, any[]>()
    cartItems.forEach(item => {
      const vendorAddress = item.listing.vendor?.wallet_address
      if (!vendorAddress) {
        diagnostics.validation.issues.push(`Vendor wallet address missing for listing: ${item.listing.title}`)
        return
      }
      
      if (!vendorGroups.has(vendorAddress)) {
        vendorGroups.set(vendorAddress, [])
      }
      vendorGroups.get(vendorAddress)!.push(item)
    })

    // Check 3: Vendor whitelist status
    console.log('[Payment Diagnostic] Checking vendor whitelist status...')
    for (const [vendorAddress, items] of vendorGroups) {
      try {
        const isWhitelisted = await isVendorWhitelisted(vendorAddress)
        console.log(`[Payment Diagnostic] Vendor ${vendorAddress} whitelisted: ${isWhitelisted}`)
        
        if (!isWhitelisted) {
          diagnostics.validation.issues.push(`Vendor ${vendorAddress} is not whitelisted on contract`)
        }
        
        // Add vendor info to diagnostics
        diagnostics.cartItems.vendors = diagnostics.cartItems.vendors || []
        diagnostics.cartItems.vendors.push({
          address: vendorAddress,
          isWhitelisted,
          itemsCount: items.length,
          businessName: items[0].listing.vendor?.business_name
        })
      } catch (whitelistError) {
        console.error(`[Payment Diagnostic] Error checking vendor ${vendorAddress}:`, whitelistError)
        diagnostics.validation.issues.push(`Failed to check whitelist status for vendor ${vendorAddress}`)
      }
    }

    // Check 4: Token balance and allowance
    console.log('[Payment Diagnostic] Checking token balance and allowance...')
    try {
      const contractAddress = getUnilaBookAddress()
      const currentBalance = await getUniTickBalance(walletData.address)
      const currentAllowance = await getUniTickAllowance(walletData.address, contractAddress)
      
      diagnostics.tokens = {
        balance: currentBalance.toString(),
        allowance: currentAllowance.toString(),
        balanceFormatted: (Number(currentBalance) / 1e18).toFixed(6),
        allowanceFormatted: (Number(currentAllowance) / 1e18).toFixed(6)
      }

      // Calculate required amount
      let totalAmount = 0
      for (const [vendorAddress, items] of vendorGroups) {
        const vendorAmount = items.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0)
        totalAmount += vendorAmount
      }
      
      const platformFeeInTokens = totalAmount * 0.005 // 0.5%
      const platformFeeInWei = BigInt(Math.floor(platformFeeInTokens * 1e18))
      const totalAmountInWei = BigInt(Math.floor(totalAmount * 1e18))
      const totalWithFee = totalAmountInWei + platformFeeInWei
      
      diagnostics.payment = {
        subtotal: totalAmount,
        platformFeeInTokens,
        platformFeeInWei: platformFeeInWei.toString(),
        totalWithFee: totalWithFee.toString(),
        totalWithFeeFormatted: (Number(totalWithFee) / 1e18).toFixed(6)
      }

      if (currentBalance < totalWithFee) {
        diagnostics.validation.issues.push(`Insufficient token balance. Required: ${totalWithFee.toString()}, Available: ${currentBalance.toString()}`)
      }

      if (currentAllowance < totalWithFee) {
        diagnostics.validation.issues.push(`Insufficient token allowance. Required: ${totalWithFee.toString()}, Available: ${currentAllowance.toString()}`)
      }
    } catch (tokenError) {
      console.error('[Payment Diagnostic] Error checking tokens:', tokenError)
      diagnostics.validation.issues.push('Failed to check token balance and allowance')
    }

    // Check 5: Array length validation
    const vendorPaymentsCount = cartItems.length // Now one payment per cart item
    const serviceNamesCount = cartItems.length
    const bookingDatesCount = cartItems.length

    diagnostics.arrays = {
      vendorPaymentsCount,
      serviceNamesCount,
      bookingDatesCount,
      lengthsMatch: vendorPaymentsCount === serviceNamesCount && serviceNamesCount === bookingDatesCount
    }

    if (vendorPaymentsCount !== serviceNamesCount) {
      diagnostics.validation.issues.push(`Vendor payments count (${vendorPaymentsCount}) does not match service names count (${serviceNamesCount})`)
    }

    if (serviceNamesCount !== bookingDatesCount) {
      diagnostics.validation.issues.push(`Service names count (${serviceNamesCount}) does not match booking dates count (${bookingDatesCount})`)
    }

    // Check 7: Detailed vendor address validation
    console.log('[Payment Diagnostic] Performing detailed vendor address validation...')
    for (const item of cartItems) {
      const vendorAddress = item.listing.vendor?.wallet_address
      const vendorId = item.listing.vendor_id
      
      if (!vendorAddress) {
        diagnostics.validation.issues.push(`Vendor wallet address missing for listing: ${item.listing.title} (vendor_id: ${vendorId})`)
        continue
      }
      
      // Check address format
      if (!vendorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        diagnostics.validation.issues.push(`Invalid vendor address format for ${item.listing.title}: ${vendorAddress}`)
      }
      
      // Check if vendor is verified in database
      try {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id, wallet_address, is_verified, business_name')
          .eq('id', vendorId)
          .single()
        
        if (vendorError || !vendorData) {
          diagnostics.validation.issues.push(`Vendor not found in database: ${vendorId}`)
        } else if (!vendorData.is_verified) {
          diagnostics.validation.issues.push(`Vendor ${vendorData.business_name} is not verified`)
        } else if (vendorData.wallet_address !== vendorAddress) {
          diagnostics.validation.issues.push(`Vendor wallet address mismatch: DB has ${vendorData.wallet_address}, listing has ${vendorAddress}`)
        }
      } catch (vendorCheckError) {
        diagnostics.validation.issues.push(`Failed to verify vendor ${vendorId}: ${vendorCheckError}`)
      }
    }

    // Check 8: Amount precision validation
    console.log('[Payment Diagnostic] Checking amount precision...')
    for (const item of cartItems) {
      const itemAmount = item.listing.price * item.quantity
      const itemAmountInWei = BigInt(Math.floor(itemAmount * 1e18))
      
      if (itemAmount <= 0) {
        diagnostics.validation.issues.push(`Invalid amount for item ${item.listing.title}: ${itemAmount}`)
      }
      
      if (itemAmountInWei <= 0n) {
        diagnostics.validation.issues.push(`Invalid amount in wei for item ${item.listing.title}: ${itemAmountInWei.toString()}`)
      }
      
      // Check for precision loss
      const reconstructedAmount = Number(itemAmountInWei) / 1e18
      if (Math.abs(reconstructedAmount - itemAmount) > 0.000001) {
        diagnostics.validation.warnings.push(`Precision loss detected for ${item.listing.title}: original=${itemAmount}, reconstructed=${reconstructedAmount}`)
      }
    }

    // Check 10: Contract token balance check (removed - not relevant)
    // The contract receives tokens during the transaction via transferFrom

    // Check 11: Platform wallet configuration
    console.log('[Payment Diagnostic] Checking platform wallet configuration...')
    try {
      const { getContractClient } = await import('@/lib/contract-client')
      const contract = getContractClient()
      const platformWallet = await contract.read.platformWallet()
      
      diagnostics.platformWallet = {
        address: platformWallet,
        isValid: platformWallet !== '0x0000000000000000000000000000000000000000'
      }
      
      if (platformWallet === '0x0000000000000000000000000000000000000000') {
        diagnostics.validation.issues.push('Platform wallet is not configured (zero address)')
      }
      
    } catch (platformWalletError) {
      console.error('[Payment Diagnostic] Error checking platform wallet:', platformWalletError)
      diagnostics.validation.issues.push('Failed to check platform wallet configuration')
    }

    // Check 12: Platform fee configuration
    console.log('[Payment Diagnostic] Checking platform fee configuration...')
    try {
      const { getContractClient } = await import('@/lib/contract-client')
      const contract = getContractClient()
      const platformFeeBps = await contract.read.platformFeeBps()
      
      diagnostics.platformFee = {
        feeBps: platformFeeBps.toString(),
        feePercentage: (Number(platformFeeBps) / 100).toFixed(2) + '%'
      }
      
      if (platformFeeBps === 0n) {
        diagnostics.validation.warnings.push('Platform fee is set to 0%')
      }
      
    } catch (platformFeeError) {
      console.error('[Payment Diagnostic] Error checking platform fee:', platformFeeError)
      diagnostics.validation.issues.push('Failed to check platform fee configuration')
    }

    // Check 13: Contract whitelist status check
    console.log('[Payment Diagnostic] Checking contract whitelist status...')
    try {
      const { isVendorWhitelisted } = await import('@/lib/contract-client')
      
      diagnostics.whitelistStatus = {}
      for (const item of cartItems) {
        const vendorAddress = item.listing.vendor?.wallet_address
        if (vendorAddress) {
          try {
            const isWhitelisted = await isVendorWhitelisted(vendorAddress)
            diagnostics.whitelistStatus[vendorAddress] = isWhitelisted
            
            if (!isWhitelisted) {
              diagnostics.validation.issues.push(`Vendor ${vendorAddress} (${item.listing.vendor?.business_name}) is not whitelisted on contract`)
            }
          } catch (whitelistError) {
            diagnostics.validation.issues.push(`Failed to check whitelist status for vendor ${vendorAddress}: ${whitelistError}`)
          }
        }
      }
    } catch (whitelistCheckError) {
      console.error('[Payment Diagnostic] Error checking whitelist status:', whitelistCheckError)
      diagnostics.validation.issues.push('Failed to check vendor whitelist status on contract')
    }

    // Summary
    diagnostics.summary = {
      totalIssues: diagnostics.validation.issues.length,
      totalWarnings: diagnostics.validation.warnings.length,
      canProceed: diagnostics.validation.issues.length === 0,
      criticalIssues: diagnostics.validation.issues.filter(issue => 
        issue.includes('not whitelisted') || 
        issue.includes('Insufficient') ||
        issue.includes('missing') ||
        issue.includes('simulation failed')
      )
    }

    console.log('[Payment Diagnostic] Validation complete:', diagnostics.summary)

    return NextResponse.json({
      success: true,
      diagnostics,
      message: `Found ${diagnostics.validation.issues.length} issues and ${diagnostics.validation.warnings.length} warnings`
    })

  } catch (error) {
    console.error('[Payment Diagnostic] Error:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostic failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


