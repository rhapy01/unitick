import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPublicClient, getUnilaBookAddress } from "@/lib/contract-client"
import { parseAbi } from "viem"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transactionHash } = await request.json()

    if (!transactionHash) {
      return NextResponse.json({ 
        error: "Transaction hash is required" 
      }, { status: 400 })
    }

    console.log('🔍 Debugging failed transaction:', transactionHash)

    const publicClient = getPublicClient()
    const contractAddress = getUnilaBookAddress()
    
    // Get transaction details
    const tx = await publicClient.getTransaction({ hash: transactionHash as `0x${string}` })
    const receipt = await publicClient.getTransactionReceipt({ hash: transactionHash as `0x${string}` })
    
    console.log('📋 Transaction details:', {
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      gasLimit: tx.gas.toString(),
      gasPrice: tx.gasPrice?.toString(),
      nonce: tx.nonce,
      data: tx.input
    })
    
    console.log('📋 Receipt details:', {
      status: receipt.status,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber.toString(),
      logs: receipt.logs.length
    })

    // Try to decode the transaction data
    const unilaBookAbi = parseAbi([
      "function createOrder((address vendor, uint256 amount, bool isPaid)[] vendorPayments, string[] serviceNames, uint256[] bookingDates, string metadata) external returns (uint256)"
    ])

    let decodedData = null
    try {
      decodedData = publicClient.decodeFunctionData({
        abi: unilaBookAbi,
        data: tx.input
      })
      console.log('📋 Decoded function data:', decodedData)
    } catch (decodeError) {
      console.error('Failed to decode transaction data:', decodeError)
    }

    // Check if the transaction was sent to the correct contract
    const isCorrectContract = tx.to?.toLowerCase() === contractAddress.toLowerCase()
    
    // Check gas usage vs limit
    const gasUsedPercent = (Number(receipt.gasUsed) / Number(tx.gas)) * 100
    
    const debugInfo = {
      transaction: {
        hash: transactionHash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasLimit: tx.gas.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasUsedPercent: gasUsedPercent.toFixed(2) + '%',
        gasPrice: tx.gasPrice?.toString(),
        nonce: tx.nonce,
        status: receipt.status
      },
      contract: {
        expectedAddress: contractAddress,
        actualAddress: tx.to,
        isCorrectContract
      },
      decodedData,
      analysis: {
        possibleCauses: []
      }
    }

    // Analyze possible causes
    if (!isCorrectContract) {
      debugInfo.analysis.possibleCauses.push('Transaction sent to wrong contract address')
    }
    
    if (gasUsedPercent > 95) {
      debugInfo.analysis.possibleCauses.push('Transaction ran out of gas')
    }
    
    if (receipt.status === 'reverted') {
      debugInfo.analysis.possibleCauses.push('Contract execution reverted (check logs for specific reason)')
    }
    
    if (tx.value > 0n) {
      debugInfo.analysis.possibleCauses.push('Transaction sent ETH value (should be 0 for token transfers)')
    }

    return NextResponse.json({ 
      success: true,
      debugInfo,
      message: 'Transaction debug completed'
    })

  } catch (error) {
    console.error('Error debugging transaction:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
