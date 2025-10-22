import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPublicClient, getUnilaBookAddress } from "@/lib/contract-client"
import { getContractAddress } from "@/lib/addresses"
import { parseAbi } from "viem"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Diagnosing contract setup...')

    const publicClient = getPublicClient()
    
    // Get contract addresses
    const unilaBookAddress = getUnilaBookAddress()
    const unitickAddress = getContractAddress("UNITICK")
    
    console.log('📋 Contract addresses:', { unilaBookAddress, unitickAddress })

    // Check if contracts exist
    const unilaBookCode = await publicClient.getCode({ address: unilaBookAddress })
    const unitickCode = await publicClient.getCode({ address: unitickAddress })

    const diagnostics = {
      contracts: {
        unilaBook: {
          address: unilaBookAddress,
          exists: unilaBookCode !== '0x',
          codeSize: unilaBookCode.length
        },
        unitick: {
          address: unitickAddress,
          exists: unitickCode !== '0x',
          codeSize: unitickCode.length
        }
      },
      environment: {
        NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS,
        NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS,
        NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL
      }
    }

    // If contracts exist, check their configuration
    if (unilaBookCode !== '0x' && unitickCode !== '0x') {
      try {
        // Check UnilaBook contract configuration
        const unilaBookAbi = parseAbi([
          "function uniTickToken() external view returns (address)",
          "function platformWallet() external view returns (address)",
          "function platformFeeBps() external view returns (uint256)"
        ])

        const [contractUnitickAddress, platformWallet, platformFeeBps] = await Promise.all([
          publicClient.readContract({
            address: unilaBookAddress,
            abi: unilaBookAbi,
            functionName: "uniTickToken"
          }),
          publicClient.readContract({
            address: unilaBookAddress,
            abi: unilaBookAbi,
            functionName: "platformWallet"
          }),
          publicClient.readContract({
            address: unilaBookAddress,
            abi: unilaBookAbi,
            functionName: "platformFeeBps"
          })
        ])

        diagnostics.contracts.unilaBook.configuration = {
          configuredUnitickAddress: contractUnitickAddress,
          platformWallet,
          platformFeeBps: Number(platformFeeBps),
          unitickAddressMatches: contractUnitickAddress.toLowerCase() === unitickAddress.toLowerCase()
        }

        // Check UniTick contract details
        const unitickAbi = parseAbi([
          "function name() external view returns (string)",
          "function symbol() external view returns (string)",
          "function decimals() external view returns (uint8)",
          "function totalSupply() external view returns (uint256)"
        ])

        const [name, symbol, decimals, totalSupply] = await Promise.all([
          publicClient.readContract({
            address: unitickAddress,
            abi: unitickAbi,
            functionName: "name"
          }),
          publicClient.readContract({
            address: unitickAddress,
            abi: unitickAbi,
            functionName: "symbol"
          }),
          publicClient.readContract({
            address: unitickAddress,
            abi: unitickAbi,
            functionName: "decimals"
          }),
          publicClient.readContract({
            address: unitickAddress,
            abi: unitickAbi,
            functionName: "totalSupply"
          })
        ])

        diagnostics.contracts.unitick.configuration = {
          name,
          symbol,
          decimals: Number(decimals),
          totalSupply: totalSupply.toString()
        }

      } catch (configError) {
        console.error('Error reading contract configuration:', configError)
        diagnostics.error = `Failed to read contract configuration: ${configError instanceof Error ? configError.message : 'Unknown error'}`
      }
    }

    // Check for issues
    const issues = []
    
    if (unilaBookCode === '0x') {
      issues.push('UnilaBook contract does not exist at the specified address')
    }
    
    if (unitickCode === '0x') {
      issues.push('UniTick contract does not exist at the specified address')
    }
    
    if (diagnostics.contracts.unilaBook.configuration?.unitickAddressMatches === false) {
      issues.push('UnilaBook contract is configured with a different UniTick address than expected')
    }

    diagnostics.issues = issues
    diagnostics.hasIssues = issues.length > 0

    return NextResponse.json({ 
      success: true,
      diagnostics,
      message: issues.length > 0 ? 'Contract setup issues detected' : 'Contract setup looks good'
    })

  } catch (error) {
    console.error('Error diagnosing contract setup:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
