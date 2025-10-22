import { createClient } from "@/lib/supabase/client"

export interface PaymentVerificationRequest {
  transactionHash: string
  orderId: string
  expectedAmount: string
  fromAddress: string
  toAddress: string
  chainId: number
}

export interface PaymentVerificationResponse {
  success: boolean
  message: string
  orderId?: string
  transactionHash?: string
  error?: string
}

export async function verifyPaymentOnChain(
  request: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: request
    })

    if (error) {
      console.error('Payment verification error:', error)
      return {
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      }
    }

    return data as PaymentVerificationResponse
  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      success: false,
      message: 'Network error during payment verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function pollTransactionConfirmation(
  transactionHash: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<boolean> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [transactionHash],
          id: 1
        })
      })

      const data = await response.json()
      
      if (data.result && data.result.status === '0x1') {
        return true // Transaction confirmed successfully
      }
      
      if (data.result && data.result.status === '0x0') {
        return false // Transaction failed
      }

      // Transaction not yet mined, wait and retry
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    } catch (error) {
      console.error('Error polling transaction:', error)
      // Continue polling on error
    }
  }
  
  return false // Timeout
}
