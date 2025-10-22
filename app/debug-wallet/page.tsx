'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Wallet, AlertCircle, CheckCircle } from 'lucide-react'

export default function WalletDebugPage() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [error, setError] = useState('')

  const checkWallet = async () => {
    if (!password) {
      setError('Please enter your wallet password')
      return
    }

    setIsLoading(true)
    setError('')
    setDebugInfo(null)

    try {
      const response = await fetch('/api/debug/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check wallet')
      }

      setDebugInfo(result.debug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check wallet')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet Debug Tool</h1>
        <p className="text-muted-foreground">
          This tool helps debug wallet address mismatches and ETH balance issues.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Verification
          </CardTitle>
          <CardDescription>
            Enter your wallet password to check which wallet address the system is using
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Wallet Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your wallet password"
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={checkWallet} 
            disabled={isLoading || !password}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking Wallet...
              </>
            ) : (
              'Check Wallet'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Debug Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Wallet Addresses</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Profile Wallet:</span>
                    <div className="font-mono bg-muted p-2 rounded mt-1 break-all">
                      {debugInfo.profileWalletAddress}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Derived Wallet:</span>
                    <div className="font-mono bg-muted p-2 rounded mt-1 break-all">
                      {debugInfo.derivedWalletAddress}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Addresses Match:</span>
                    {debugInfo.addressesMatch ? (
                      <span className="text-green-600 font-semibold">✓ Yes</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗ No</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">ETH Balance</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Current Balance:</span>
                    <div className="font-mono bg-muted p-2 rounded mt-1">
                      {debugInfo.ethBalanceEth} ETH
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Required for Gas:</span>
                    <div className="font-mono bg-muted p-2 rounded mt-1">
                      {debugInfo.minRequiredEth} ETH
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Has Enough ETH:</span>
                    {debugInfo.hasEnoughEth ? (
                      <span className="text-green-600 font-semibold">✓ Yes</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗ No</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Raw Data</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {debugInfo.explanation && (
              <Alert className={debugInfo.explanation.issue === 'No issues detected' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>Issue:</strong> {debugInfo.explanation.issue}
                    </div>
                    <div>
                      <strong>Solution:</strong> {debugInfo.explanation.solution}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!debugInfo.addressesMatch && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issue Found:</strong> The wallet address in your profile doesn't match the one derived from your password. 
                  This means the system is checking a different wallet than where your ETH is located.
                </AlertDescription>
              </Alert>
            )}

            {!debugInfo.hasEnoughEth && debugInfo.addressesMatch && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issue Found:</strong> The wallet address is correct, but it doesn't have enough ETH for gas fees. 
                  You need at least 0.001 ETH for gas fees.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
