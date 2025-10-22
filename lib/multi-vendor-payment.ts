import { createClient } from "@/lib/supabase/client"

/**
 * Validates that a vendor address is whitelisted (belongs to a verified vendor)
 */
export async function validateVendorAddress(vendorId: string, address: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if vendor exists, is verified, and the address matches
    const { data, error } = await supabase
      .from("vendors")
      .select("id, wallet_address, is_verified")
      .eq("id", vendorId)
      .eq("wallet_address", address)
      .eq("is_verified", true)
      .single()

    if (error || !data) {
      console.error(`Vendor address validation failed for vendor ${vendorId}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error validating vendor address:", error)
    return false
  }
}

/**
 * Get all whitelisted vendor addresses for reference
 */
export async function getWhitelistedVendorAddresses(): Promise<string[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("vendors")
      .select("wallet_address")
      .eq("is_verified", true)
      .not("wallet_address", "is", null)

    if (error) {
      console.error("Error fetching whitelisted addresses:", error)
      return []
    }

    return (data || []).map(vendor => vendor.wallet_address).filter(Boolean)
  } catch (error) {
    console.error("Error getting whitelisted vendor addresses:", error)
    return []
  }
}

/**
 * Check if a vendor is eligible to receive payments
 */
export async function isVendorPaymentEligible(vendorId: string): Promise<{
  eligible: boolean;
  reason?: string;
  vendor?: any;
}> {
  try {
    const supabase = createClient()

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, wallet_address, is_verified, business_name")
      .eq("id", vendorId)
      .single()

    if (error || !vendor) {
      return {
        eligible: false,
        reason: "Vendor not found"
      }
    }

    if (!vendor.is_verified) {
      return {
        eligible: false,
        reason: "Vendor is not verified",
        vendor
      }
    }

    if (!vendor.wallet_address) {
      return {
        eligible: false,
        reason: "Vendor has no wallet address configured",
        vendor
      }
    }

    if (!vendor.wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return {
        eligible: false,
        reason: "Vendor has invalid wallet address format",
        vendor
      }
    }

    return {
      eligible: true,
      vendor
    }
  } catch (error) {
    console.error("Error checking vendor payment eligibility:", error)
    return {
      eligible: false,
      reason: "Error checking vendor status"
    }
  }
}

export interface VendorPayment {
  vendorId: string
  vendorAddress: string
  amount: number // USD amount
  ethAmount: number // ETH equivalent
  bookingIds: string[]
}

export interface MultiVendorPaymentResult {
  vendorPayments: VendorPayment[]
  totalAmount: number
  platformFee: number
  userPaysTotal: number
}

export async function calculateMultiVendorPayments(cartItems: any[]): Promise<MultiVendorPaymentResult> {
  // Group items by vendor
  const vendorGroups = new Map<string, any[]>()

  cartItems.forEach(item => {
    const vendorId = item.listing.vendor_id
    if (!vendorGroups.has(vendorId)) {
      vendorGroups.set(vendorId, [])
    }
    vendorGroups.get(vendorId)!.push(item)
  })

  const vendorPayments: VendorPayment[] = []
  let totalSubtotal = 0

  // Validate all vendor addresses before processing payments
  for (const [vendorId, items] of vendorGroups) {
    const vendorAddress = items[0].listing.vendor?.wallet_address || ""

    // Basic validation
    if (!vendorAddress) {
      throw new Error(`No wallet address found for vendor ${vendorId}`)
    }

    if (!vendorAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error(`Invalid wallet address format for vendor ${vendorId}`)
    }

    // Security: Validate vendor is whitelisted (verified and address matches)
    const isValidVendor = await validateVendorAddress(vendorId, vendorAddress)
    if (!isValidVendor) {
      throw new Error(`Vendor ${vendorId} is not authorized to receive payments or address mismatch`)
    }

    const vendorSubtotal = items.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0)
    totalSubtotal += vendorSubtotal

    vendorPayments.push({
      vendorId,
      vendorAddress,
      amount: vendorSubtotal,
      ethAmount: 0, // Will be calculated later
      bookingIds: items.map((item: any) => item._id || item.id)
    })
  }

  const platformFee = totalSubtotal * 0.005 // 0.5% - match contract
  const userPaysTotal = totalSubtotal + platformFee

  return {
    vendorPayments,
    totalAmount: totalSubtotal,
    platformFee,
    userPaysTotal
  }
}

export async function sendMultiVendorPayments(
  vendorPayments: VendorPayment[],
  fromAddress: string
): Promise<{ vendorId: string; txHash: string }[]> {
  const results: { vendorId: string; txHash: string }[] = []
  
  // Send payment to each vendor
  for (const vendorPayment of vendorPayments) {
    try {
      const txHash = await sendPayment(vendorPayment.vendorAddress, vendorPayment.ethAmount.toFixed(6))
      results.push({ vendorId: vendorPayment.vendorId, txHash })
    } catch (error) {
      console.error(`Failed to send payment to vendor ${vendorPayment.vendorId}:`, error)
      throw new Error(`Payment failed for vendor ${vendorPayment.vendorId}`)
    }
  }
  
  return results
}

// Import the sendPayment function
async function sendPayment(toAddress: string, amountInEth: string): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed")
  }

  // Validate recipient address format
  if (!toAddress || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error("Invalid recipient address format")
  }

  // Additional security: Check if address is in our whitelist
  const whitelistedAddresses = await getWhitelistedVendorAddresses()
  if (!whitelistedAddresses.includes(toAddress)) {
    throw new Error("Recipient address is not authorized to receive payments")
  }

  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as string[]

  if (accounts.length === 0) {
    throw new Error("No wallet connected")
  }

  const fromAddress = accounts[0]

  // Prevent self-payment
  if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
    throw new Error("Cannot send payment to your own address")
  }

  const amount = Number.parseFloat(amountInEth)
  if (amount <= 0) {
    throw new Error("Invalid payment amount")
  }

  const amountInWei = (amount * 1e18).toString(16)

  const gasPrice = await window.ethereum.request({
    method: "eth_gasPrice",
  }) as string

  const transactionHash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: fromAddress,
        to: toAddress,
        value: `0x${amountInWei}`,
        gasPrice: gasPrice,
      },
    ],
  })) as string

  // Validate transaction hash format
  if (!transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    throw new Error("Invalid transaction hash received")
  }

  return transactionHash
}
