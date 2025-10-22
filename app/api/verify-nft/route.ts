import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyNftOwnership } from "@/lib/nft"

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, tokenId, expectedOwner } = await request.json()

    // Validate required fields
    if (!contractAddress || !tokenId || !expectedOwner) {
      return NextResponse.json(
        { error: "Missing required fields: contractAddress, tokenId, expectedOwner" },
        { status: 400 }
      )
    }

    let isValid = false
    let verificationMethod = "blockchain"
    let fallbackUsed = false

    try {
      // Primary: Verify NFT ownership on blockchain
      isValid = await verifyNftOwnership(
        contractAddress as `0x${string}`,
        BigInt(tokenId),
        expectedOwner as `0x${string}`
      )
    } catch (blockchainError) {
      console.warn("Blockchain verification failed, trying database fallback:", blockchainError)
      
      // Fallback: Check database for NFT ownership
      try {
        const supabase = await createClient()
        const { data: booking } = await supabase
          .from("bookings")
          .select(`
            id,
            nft_contract_address,
            nft_token_id,
            profiles:user_id (
              wallet_address
            )
          `)
          .eq("nft_contract_address", contractAddress)
          .eq("nft_token_id", tokenId)
          .eq("status", "confirmed")
          .single()

        if (booking && booking.profiles?.wallet_address?.toLowerCase() === expectedOwner.toLowerCase()) {
          isValid = true
          verificationMethod = "database_fallback"
          fallbackUsed = true
        }
      } catch (dbError) {
        console.error("Database fallback also failed:", dbError)
        throw new Error("Both blockchain and database verification failed")
      }
    }

    // Log verification attempt
    const supabase = await createClient()
    await supabase
      .from("ticket_verifications")
      .insert({
        order_id: null,
        vendor_id: null,
        verified_at: new Date().toISOString(),
        verified_by: null,
        nft_contract_address: contractAddress,
        nft_token_id: tokenId,
        verification_method: verificationMethod,
        is_valid: isValid,
        fallback_used: fallbackUsed
      })
      .catch(err => {
        console.warn("Failed to log verification:", err)
      })

    return NextResponse.json({
      valid: isValid,
      contractAddress,
      tokenId,
      expectedOwner,
      verifiedAt: new Date().toISOString(),
      verificationMethod,
      fallbackUsed
    })

  } catch (error) {
    console.error("NFT verification error:", error)
    return NextResponse.json(
      { 
        error: "Failed to verify NFT ownership",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
