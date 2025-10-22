"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface TokenStatus {
  success: boolean
  walletAddress: string
  contractAddress: string
  balance: string
  allowance: string
  balanceFormatted: string
  allowanceFormatted: string
}

interface ApprovalResult {
  success: boolean
  message: string
  transactionHash?: string
  currentBalance: string
  currentAllowance: string
  requestedAmount: string
  error?: string
  details?: string
}

interface TokenApprovalProps {
  userId: string
  onApprovalComplete?: (result: ApprovalResult) => void
}

export default function TokenApproval({ userId, onApprovalComplete }: TokenApprovalProps) {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [approvalAmount, setApprovalAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load token status on component mount
  useEffect(() => {
    // First test basic API functionality
    testBasicAPI().then(() => {
      loadTokenStatus()
    })
  }, [])

  const testBasicAPI = async () => {
    try {
      console.log('[Token Approval] Testing basic API...')
      const response = await fetch('/api/test')
      const result = await response.json()
      console.log('[Token Approval] Basic API test result:', result)
    } catch (err) {
      console.error('[Token Approval] Basic API test failed:', err)
    }
  }

  const loadTokenStatus = async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      console.log('[Token Approval] Loading token status for user:', userId)
      const response = await fetch(`/api/token-approval?userId=${userId}`)
      const result = await response.json()
      
      console.log('[Token Approval] API response:', { 
        status: response.status, 
        ok: response.ok, 
        result 
      })
      
      if (response.ok) {
        setTokenStatus(result)
        console.log('[Token Approval] Status loaded successfully:', result)
      } else {
        const errorMessage = result.details || result.error || `Failed to load token status (${response.status})`
        setError(errorMessage)
        console.error('[Token Approval] Status error:', result)
        console.error('[Token Approval] Response status:', response.status)
        console.error('[Token Approval] Response headers:', Object.fromEntries(response.headers.entries()))
      }
    } catch (err) {
      const errorMessage = 'Network error loading token status'
      setError(errorMessage)
      console.error('[Token Approval] Network error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApproval = async () => {
    if (!approvalAmount || isNaN(Number(approvalAmount))) {
      setError('Please enter a valid approval amount')
      return
    }

    setIsLoading(true)
    setError(null)
    setApprovalResult(null)
    
    try {
      // Convert to token units (multiply by 1e18 for 18 decimals)
      // Use string manipulation to avoid scientific notation issues
      const amountInTokens = Number(approvalAmount)
      if (amountInTokens <= 0) {
        setError('Approval amount must be greater than 0')
        return
      }
      
      // Check if amount is too large (more than 1 billion tokens)
      if (amountInTokens > 1000000000) {
        setError('Approval amount is too large. Please enter an amount less than 1 billion tokens.')
        return
      }
      
      // Convert to wei using string manipulation to avoid precision issues
      // Split the number into integer and decimal parts
      const amountStr = amountInTokens.toString()
      const [integerPart, decimalPart = ''] = amountStr.split('.')
      
      // Pad decimal part to 18 digits
      const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18)
      
      // Combine integer and decimal parts
      const amountInWei = integerPart + paddedDecimal
      
      console.log('[Token Approval] Amount conversion:', {
        original: amountStr,
        integerPart,
        decimalPart,
        paddedDecimal,
        amountInWei
      })
      
      console.log('[Token Approval] Requesting approval for:', { 
        amount: approvalAmount, 
        amountInTokens,
        amountInWei 
      })
      
      const response = await fetch('/api/token-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInWei,
          userId: userId
        })
      })

      const result = await response.json()
      console.log('[Token Approval] Approval response:', result)

      if (response.ok) {
        setApprovalResult(result)
        if (onApprovalComplete) {
          onApprovalComplete(result)
        }
        
        // Refresh token status after successful approval
        if (result.transactionHash) {
          setTimeout(() => {
            loadTokenStatus()
          }, 2000)
        }
      } else {
        setError(result.details || result.error || 'Approval failed')
        console.error('[Token Approval] Approval error:', result)
      }
    } catch (err) {
      setError('Network error during approval')
      console.error('[Token Approval] Network error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          UniTick Token Approval
        </CardTitle>
        <CardDescription>
          Approve UniTick tokens for the UnilaBook contract to enable payments
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Token Status */}
        {tokenStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Wallet Address</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {formatAddress(tokenStatus.walletAddress)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Contract Address</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {formatAddress(tokenStatus.contractAddress)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Token Balance</Label>
                <p className="text-lg font-semibold">
                  {tokenStatus.balanceFormatted} UTICK
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Current Allowance</Label>
                <p className="text-lg font-semibold">
                  {tokenStatus.allowanceFormatted} UTICK
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="approvalAmount">Approval Amount (UTICK)</Label>
            <Input
              id="approvalAmount"
              type="number"
              step="0.001"
              placeholder="Enter amount to approve"
              value={approvalAmount}
              onChange={(e) => setApprovalAmount(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter the amount of UniTick tokens to approve for the contract
            </p>
          </div>

          <Button 
            onClick={handleApproval} 
            disabled={isLoading || !approvalAmount}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Approval...
              </>
            ) : (
              'Approve Tokens'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Approval Result */}
        {approvalResult && (
          <Alert variant={approvalResult.success ? "default" : "destructive"}>
            {approvalResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{approvalResult.message}</p>
                {approvalResult.transactionHash && (
                  <p className="text-sm font-mono">
                    Transaction: {formatAddress(approvalResult.transactionHash)}
                  </p>
                )}
                {approvalResult.error && (
                  <p className="text-sm text-red-600">{approvalResult.error}</p>
                )}
                {approvalResult.details && (
                  <p className="text-sm text-red-600">{approvalResult.details}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={loadTokenStatus}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
