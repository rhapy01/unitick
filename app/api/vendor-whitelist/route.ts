import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPublicClient, getUnilaBookAddress } from "@/lib/contract-client"
import { isVendorWhitelisted, addVendorToWhitelist } from "@/lib/contract-client"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { vendorAddresses } = await request.json()

    if (!vendorAddresses || !Array.isArray(vendorAddresses)) {
      return NextResponse.json({ 
        error: "Vendor addresses array is required" 
      }, { status: 400 })
    }

    console.log('🔍 Checking vendor whitelist status for:', vendorAddresses)

    const results = []
    const contractAddress = getUnilaBookAddress()
    const publicClient = getPublicClient()

    for (const vendorAddress of vendorAddresses) {
      try {
        // Check if vendor is whitelisted on contract
        const isWhitelisted = await isVendorWhitelisted(vendorAddress)
        
        if (!isWhitelisted) {
          console.log(`⚠️ Vendor ${vendorAddress} not whitelisted, attempting to whitelist...`)
          
          // Check if vendor exists in database and is verified
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id, wallet_address, is_verified, business_name')
            .eq('wallet_address', vendorAddress)
            .eq('is_verified', true)
            .single()

          if (vendor) {
            try {
              // Add vendor to whitelist on contract
              const txHash = await addVendorToWhitelist(vendorAddress)
              console.log(`✅ Vendor ${vendorAddress} whitelisted successfully: ${txHash}`)
              
              results.push({
                vendorAddress,
                status: 'whitelisted',
                transactionHash: txHash,
                message: 'Successfully whitelisted on contract'
              })
            } catch (whitelistError) {
              console.error(`❌ Failed to whitelist vendor ${vendorAddress}:`, whitelistError)
              results.push({
                vendorAddress,
                status: 'error',
                error: whitelistError instanceof Error ? whitelistError.message : 'Unknown error',
                message: 'Failed to whitelist on contract'
              })
            }
          } else {
            results.push({
              vendorAddress,
              status: 'not_verified',
              message: 'Vendor not found in database or not verified'
            })
          }
        } else {
          results.push({
            vendorAddress,
            status: 'already_whitelisted',
            message: 'Vendor already whitelisted on contract'
          })
        }
      } catch (error) {
        console.error(`Error checking vendor ${vendorAddress}:`, error)
        results.push({
          vendorAddress,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Error checking vendor status'
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      results,
      contractAddress,
      message: `Checked ${vendorAddresses.length} vendors`
    })

  } catch (error) {
    console.error('Error checking vendor whitelist:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all verified vendors from database
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, wallet_address, business_name, is_verified')
      .eq('is_verified', true)
      .not('wallet_address', 'is', null)

    if (vendorsError) {
      return NextResponse.json({ 
        error: "Failed to fetch vendors",
        details: vendorsError.message 
      }, { status: 500 })
    }

    const vendorAddresses = vendors?.map(v => v.wallet_address).filter(Boolean) || []
    
    console.log('📋 Found verified vendors:', vendorAddresses.length)

    return NextResponse.json({ 
      success: true,
      vendors: vendors || [],
      vendorAddresses,
      count: vendorAddresses.length
    })

  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
