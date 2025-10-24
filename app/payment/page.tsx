"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { CartItem } from "@/lib/types"
import { PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Wallet, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Settings, RefreshCw } from "lucide-react"
import Link from "next/link"
import { formatAddress } from "@/lib/wallet"
import { sanitizeUserInput, sanitizeTransactionHash, sanitizePrice, sanitizeQuantity, safeJsonStringify } from "@/lib/sanitize"

type PaymentStatus = "idle" | "processing" | "success" | "error"

export default function PaymentPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tokenStatus, setTokenStatus] = useState<any>(null)
  const [needsApproval, setNeedsApproval] = useState<boolean>(true)
  const [isApproving, setIsApproving] = useState<boolean>(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUserId(user.id)

      // Load user profile to get wallet address
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError || !profileData) {
        setErrorMessage("Failed to load user profile. Please try again.")
        setIsLoading(false)
        return
      }

      setProfile(profileData)
      setWalletAddress((profileData as any).wallet_address || null)

      // Get selected item IDs from localStorage
      const selectedItemIds = localStorage.getItem("selectedCartItems")
      if (!selectedItemIds) {
        router.push("/checkout")
        return
      }

      const selectedIds = JSON.parse(selectedItemIds)
      console.log('[Payment Init] Selected cart item IDs:', selectedIds)

      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, booking_date, is_gift, recipient_name, recipient_email, recipient_phone, listing:listings(*, vendor:vendors(*))")
        .eq("user_id", user.id)
        .in("id", selectedIds)

      if (error) {
        router.push("/checkout")
        return
      }

      const items: CartItem[] = (data || []).map((row: any) => ({
        _id: row.id, // Include the database ID for cart clearing
        listing: row.listing,
        quantity: row.quantity,
        booking_date: row.booking_date,
        is_gift: row.is_gift,
        recipient_name: row.recipient_name ?? undefined,
        recipient_email: row.recipient_email ?? undefined,
        recipient_phone: row.recipient_phone ?? undefined,
      }))

      console.log('[Payment Init] Cart items loaded:', items.length)
      items.forEach((item, index) => {
        console.log(`[Payment Init] Item ${index}: listing_id=${item.listing.id}, quantity=${item.quantity}`)
      })

      if (items.length === 0) {
        router.push("/checkout")
        return
      }

      setCartItems(items)
      
      setIsLoading(false)
    }

    init()
  }, [router, supabase])

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.listing.price * item.quantity, 0)
  }

  const calculatePlatformFee = () => {
    return calculateSubtotal() * PLATFORM_FEE_PERCENTAGE
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculatePlatformFee()
  }

  const checkTokenStatus = async (userIdParam?: string | null) => {
    try {
      const currentUserId = userIdParam || userId
      console.log('[Payment] Checking token status...')
      console.log('[Payment] User ID:', currentUserId)
      console.log('[Payment] Wallet address:', walletAddress)
      
      if (!currentUserId) {
        console.error('[Payment] No user ID available for token status check')
        setErrorMessage('User not authenticated. Please refresh the page.')
        return
      }
      
      const response = await fetch(`/api/token-approval?userId=${currentUserId}`)
      console.log('[Payment] Raw response status:', response.status)
      console.log('[Payment] Raw response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('[Payment] Token status response:', { status: response.status, ok: response.ok, result })
      
      if (response.ok) {
        // Check if result has the expected structure
        if (!result || typeof result !== 'object') {
          console.error('[Payment] Invalid response structure:', result)
          setErrorMessage('Invalid token status response. Please try again.')
          return
        }
        
        if (!result.balance || !result.allowance) {
          console.error('[Payment] Missing required fields in response:', result)
          setErrorMessage('Token status response missing required data. Please try again.')
          return
        }
        
        setTokenStatus(result)
        console.log('[Payment] Token status:', result)
        
        // Check if allowance is sufficient for the total amount
        const totalAmount = calculateTotal()
        
        // Convert to wei using string manipulation to avoid precision issues
        const amountStr = totalAmount.toString()
        const [integerPart, decimalPart = ''] = amountStr.split('.')
        const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18)
        const amountInWei = integerPart + paddedDecimal
        const requiredAllowance = BigInt(amountInWei)
        
        const currentAllowance = BigInt(result.allowance)
        
        console.log('[Payment] Allowance check:', {
          totalAmount,
          requiredAllowance: requiredAllowance.toString(),
          currentAllowance: currentAllowance.toString(),
          needsApproval: currentAllowance < requiredAllowance
        })
        
        const needsApprovalValue = currentAllowance < requiredAllowance
        setNeedsApproval(needsApprovalValue)
        
        console.log('[Payment] Needs approval set to:', needsApprovalValue)
        
        // Don't show error message for insufficient allowance since we handle it automatically
        // if (currentAllowance < requiredAllowance) {
        //   setErrorMessage(`Insufficient token allowance. You need to approve ${totalAmount.toFixed(2)} UTICK tokens before payment. Current allowance: ${result.allowanceFormatted} UTICK.`)
        // }
      } else {
        console.error('[Payment] Token status check failed:', result)
        const errorMsg = result?.error || result?.details || 'Failed to check token status. Please try again.'
        setErrorMessage(errorMsg)
      }
    } catch (error) {
      console.error('[Payment] Token status check error:', error)
      setErrorMessage('Failed to check token status. Please try again.')
    }
  }

  const handleApproval = async () => {
    if (!userId) return

    setIsApproving(true)
    setErrorMessage(null)

    try {
      console.log('[Payment] Starting token approval...')
      
      // Calculate required amount using the same method as the working token approval component
      const totalAmount = calculateTotal()
      
      // Convert to wei using string manipulation to avoid precision issues
      const amountStr = totalAmount.toString()
      const [integerPart, decimalPart = ''] = amountStr.split('.')
      
      // Pad decimal part to 18 digits
      const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18)
      
      // Combine integer and decimal parts
      const amountInWei = integerPart + paddedDecimal
      const requiredAllowance = BigInt(amountInWei)
      
      console.log('[Payment] Amount conversion:', {
        original: amountStr,
        integerPart,
        decimalPart,
        paddedDecimal,
        amountInWei,
        requiredAllowance: requiredAllowance.toString()
      })
      
      // Request approval
      const approvalResponse = await fetch('/api/token-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: requiredAllowance.toString(),
          userId: userId
        })
      })

      const approvalResult = await approvalResponse.json()
      console.log('[Payment] Approval result:', approvalResult)

      if (!approvalResponse.ok) {
        throw new Error(`Token approval failed: ${approvalResult.details || approvalResult.error}`)
      }

      console.log('[Payment] Token approval successful!')
      setErrorMessage('✅ Tokens approved successfully! You can now proceed with payment.')
      
      // Switch to payment button
      setNeedsApproval(false)
      
    } catch (error) {
      console.error('[Payment] Approval error:', error)
      setErrorMessage(error instanceof Error ? error.message : "Approval failed")
    } finally {
      setIsApproving(false)
    }
  }


  const handlePayment = async () => {
    if (!walletAddress || !userId) return

    setPaymentStatus("processing")
    setErrorMessage(null)

    try {
      console.log('[Payment] Starting payment process...')
      console.log('[Payment] Cart items:', cartItems.length)
      console.log('[Payment] Wallet address:', walletAddress)
      console.log('[Payment] User ID:', userId)

      // If approval is needed, show error instead of trying to approve automatically
      if (needsApproval) {
        setErrorMessage('❌ Token approval required. Please click "Approve UTICK Tokens" button first.')
        setPaymentStatus("error")
        return
      }

      // Process payment using the internal wallet system
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          userId
        })
      })

      const result = await response.json()
      console.log('[Payment] API response:', { status: response.status, ok: response.ok, result })

      if (!response.ok) {
        console.error('[Payment] API error response:', result)
        console.error('[Payment] Response status:', response.status)
        console.error('[Payment] Response headers:', Object.fromEntries(response.headers.entries()))
        
        const errorMessage = result.details || result.error || `Payment failed (${response.status})`
        throw new Error(errorMessage)
      }

      if (result.success) {
        setTransactionHash(result.transactionHash)
        setPaymentStatus("success")
        console.log('[Payment] Payment completed successfully')

        // Clear selected items from localStorage
        localStorage.removeItem("selectedCartItems")
        
        // Note: Cart items are already cleared by the backend payment API
        console.log('[Payment] Cart items cleared by backend payment API')

        // Redirect to success page after a short delay
        setTimeout(() => {
          router.push(`/order/${result.orderId}`)
        }, 2000)
      } else {
        throw new Error(result.error || 'Payment failed')
      }

    } catch (error) {
      console.error('[Payment] Payment error:', error)
      setErrorMessage(error instanceof Error ? error.message : "Payment failed")
      setPaymentStatus("error")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-1/4 mb-8" />
            <div className="h-64 bg-card rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile?.wallet_address) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/checkout">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Checkout
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need a wallet to make payments. Please create your wallet first.
                  </AlertDescription>
                </Alert>
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard to Create Wallet</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/checkout">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Checkout
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{item.listing.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.listing.location}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.listing.price}
                        </p>
                        {item.booking_date && (
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(item.booking_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.listing.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>${calculatePlatformFee().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-medium">Wallet Address:</span>
                    </div>
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      {walletAddress ? formatAddress(walletAddress) : 'No wallet address'}
                    </p>
                  </div>

                  {tokenStatus && (
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">UTICK Balance:</span>
                          <span className="font-mono">{tokenStatus.balanceFormatted} UTICK</span>
                        </div>
                        {needsApproval && (
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Token approval required before payment
                          </div>
                        )}
                        {!needsApproval && tokenStatus && tokenStatus.allowance && parseFloat(tokenStatus.allowance) > 0 && (
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded text-sm text-green-800 dark:text-green-200">
                            ✅ Sufficient token allowance
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {paymentStatus === "success" && (
                    <div className="relative overflow-hidden rounded-lg border-2 border-green-500 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-xl mb-2">
                            ✅ Payment Confirmed!
                          </h3>
                          <p className="text-green-100 text-base">
                            Your order has been successfully processed. Redirecting to order details...
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {needsApproval ? (
                      <Button
                        onClick={handleApproval}
                        disabled={isApproving || paymentStatus === "processing" || paymentStatus === "success"}
                        variant="outline"
                        className="w-full"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Approving Tokens...
                          </>
                        ) : (
                          <>
                            <Settings className="h-4 w-4 mr-2" />
                            Approve UTICK Tokens
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePayment}
                        disabled={paymentStatus === "processing" || paymentStatus === "success"}
                        className="w-full"
                      >
                        {paymentStatus === "processing" ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          `Pay ${calculateTotal().toFixed(2)} UTICK`
                        )}
                      </Button>
                    )}
                  </div>

                  {transactionHash && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Transaction Hash:</p>
                      <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                        {transactionHash}
                      </p>
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <Link
                          href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Explorer
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}