"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TokenApproval from '@/components/token-approval'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function TokenApprovalPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setError('Authentication error: ' + error.message)
        return
      }
      
      if (!user) {
        setError('No authenticated user found')
        return
      }
      
      setUser(user)
    } catch (err) {
      setError('Failed to check authentication')
      console.error('Auth check error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalComplete = (result: any) => {
    console.log('[Token Approval Page] Approval completed:', result)
    
    if (result.success && result.transactionHash) {
      // Show success message and option to proceed to payment
      console.log('[Token Approval Page] Approval successful, can proceed to payment')
      
      // Check if user came from payment page
      const urlParams = new URLSearchParams(window.location.search)
      const returnTo = urlParams.get('returnTo')
      
      if (returnTo === 'payment') {
        // Redirect back to payment page after a short delay
        setTimeout(() => {
          router.push('/payment')
        }, 2000)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Please log in to access token approval</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Token Approval Test</h1>
            <p className="text-muted-foreground mt-2">
              Test UniTick token approval before attempting payments
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test Token Approval</CardTitle>
            <CardDescription>
              Follow these steps to test the token approval process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Check Token Status</h4>
              <p className="text-sm text-muted-foreground">
                The component will automatically load your current UniTick token balance and allowance.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Enter Approval Amount</h4>
              <p className="text-sm text-muted-foreground">
                Enter the amount of UniTick tokens you want to approve for the contract (e.g., 100 for 100 UTICK).
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Approve Tokens</h4>
              <p className="text-sm text-muted-foreground">
                Click "Approve Tokens" to send the approval transaction to the blockchain.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 4: Verify Transaction</h4>
              <p className="text-sm text-muted-foreground">
                Check the transaction hash on Base Sepolia Explorer to verify the approval was successful.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Token Approval Component */}
        <TokenApproval 
          userId={user.id} 
          onApprovalComplete={handleApprovalComplete}
        />

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              • <strong>Gas Fees:</strong> Token approval requires ETH for gas fees
            </p>
            <p className="text-sm">
              • <strong>Network:</strong> Make sure you're connected to Base Sepolia Testnet
            </p>
            <p className="text-sm">
              • <strong>Tokens:</strong> You need UniTick tokens in your wallet to approve
            </p>
            <p className="text-sm">
              • <strong>Explorer:</strong> 
              <a 
                href="https://sepolia.basescan.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline inline-flex items-center"
              >
                Base Sepolia Explorer <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
