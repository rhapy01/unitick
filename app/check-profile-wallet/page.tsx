'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProfileWalletCheckPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [error, setError] = useState('')

  const checkProfileWallet = async () => {
    setIsLoading(true)
    setError('')
    setWalletInfo(null)

    try {
      const response = await fetch('/api/check-profile-wallet')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check profile wallet')
      }

      setWalletInfo(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check profile wallet')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkProfileWallet()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Wallet Check</h1>
        <p className="text-muted-foreground">
          Check the ETH balance of your profile wallet address (the one stored in your database).
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Profile Wallet
          </CardTitle>
          <CardDescription>
            This is the wallet address stored in your profile database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkProfileWallet} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking Wallet...
              </>
            ) : (
              'Refresh Check'
            )}
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {walletInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {walletInfo.hasEnoughEth ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Wallet Balance Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <span className="font-medium">Wallet Address:</span>
                <div className="font-mono bg-muted p-3 rounded mt-1 break-all text-sm">
                  {walletInfo.profileWalletAddress}
                </div>
              </div>
              
              <div>
                <span className="font-medium">ETH Balance:</span>
                <div className="text-2xl font-bold mt-1">
                  {walletInfo.ethBalanceEth} ETH
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Has Enough for Gas:</span>
                {walletInfo.hasEnoughEth ? (
                  <span className="text-green-600 font-semibold">✓ Yes (≥0.001 ETH)</span>
                ) : (
                  <span className="text-red-600 font-semibold">✗ No (Need ≥0.001 ETH)</span>
                )}
              </div>
            </div>

            <Alert className={walletInfo.hasEnoughEth ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Status:</strong> {walletInfo.message}
                  </div>
                  {!walletInfo.hasEnoughEth && (
                    <div>
                      <strong>Solution:</strong> Send at least 0.001 ETH to your profile wallet address above to cover gas fees for the faucet claim.
                    </div>
                  )}
                  {walletInfo.hasEnoughEth && (
                    <div>
                      <strong>Good News:</strong> Your profile wallet has enough ETH for gas fees. The faucet should work now!
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
