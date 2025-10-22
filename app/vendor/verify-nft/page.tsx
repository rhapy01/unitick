"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Shield, 
  ExternalLink,
  Copy,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VerificationResult {
  valid: boolean
  contractAddress: string
  tokenId: string
  expectedOwner: string
  verifiedAt: string
  verificationMethod: string
}

export default function VendorVerificationPage() {
  const [contractAddress, setContractAddress] = useState("")
  const [tokenId, setTokenId] = useState("")
  const [expectedOwner, setExpectedOwner] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleVerify = async () => {
    if (!contractAddress || !tokenId || !expectedOwner) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setIsVerifying(true)
    setError(null)
    setVerificationResult(null)

    try {
      const response = await fetch('/api/verify-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          tokenId,
          expectedOwner
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed')
      }

      setVerificationResult(result)
      
      toast({
        title: result.valid ? "Verification Successful" : "Verification Failed",
        description: result.valid 
          ? "NFT ownership verified on blockchain" 
          : "NFT ownership could not be verified",
        variant: result.valid ? "default" : "destructive"
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
      toast({
        title: "Verification Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-accent mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">NFT Ticket Verification</h1>
            <p className="text-muted-foreground">
              Verify ticket ownership on the blockchain for ultimate security
            </p>
          </div>

          {/* Verification Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractAddress">NFT Contract Address</Label>
                  <Input
                    id="contractAddress"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    placeholder="123"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expectedOwner">Expected Owner Wallet Address</Label>
                <Input
                  id="expectedOwner"
                  placeholder="0x..."
                  value={expectedOwner}
                  onChange={(e) => setExpectedOwner(e.target.value)}
                  className="font-mono"
                />
              </div>

              <Button 
                onClick={handleVerify} 
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify NFT Ownership
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={verificationResult.valid ? "default" : "destructive"}>
                    {verificationResult.valid ? "VALID" : "INVALID"}
                  </Badge>
                  <Badge variant="outline">
                    {verificationResult.verificationMethod}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Contract Address</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">
                        {verificationResult.contractAddress}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(verificationResult.contractAddress)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Token ID</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm bg-muted p-2 rounded flex-1">
                        {verificationResult.tokenId}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(verificationResult.tokenId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Expected Owner</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm break-all bg-muted p-2 rounded flex-1">
                      {verificationResult.expectedOwner}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(verificationResult.expectedOwner)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Verified At</Label>
                  <p className="text-sm">
                    {new Date(verificationResult.verifiedAt).toLocaleString()}
                  </p>
                </div>

                {verificationResult.valid && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      This NFT is owned by the expected wallet address. The ticket is valid and ready for service.
                    </AlertDescription>
                  </Alert>
                )}

                {!verificationResult.valid && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      This NFT is not owned by the expected wallet address. Please verify the information or contact support.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">For Vendors:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Ask the customer to show their ticket (PDF or QR code)</li>
                  <li>Copy the NFT Contract Address from the ticket</li>
                  <li>Copy the Token ID from the ticket</li>
                  <li>Ask the customer for their wallet address (the one they used to purchase)</li>
                  <li>Click "Verify NFT Ownership" to check on blockchain</li>
                  <li>If valid, proceed with service delivery</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Benefits of Blockchain Verification:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Immutable proof of ownership</li>
                  <li>Real-time verification</li>
                  <li>No database dependencies</li>
                  <li>Cryptographically secure</li>
                  <li>Cannot be tampered with</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
