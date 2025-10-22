"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Copy
} from "lucide-react"
import { formatAddress } from "@/lib/wallet"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

interface WalletStatusProps {
  showDisconnect?: boolean
  className?: string
}

export function WalletStatus({ showDisconnect = false, className }: WalletStatusProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch user's internal wallet address
    const fetchWalletAddress = async () => {
      try {
        const response = await fetch('/api/wallet/create')
        if (response.ok) {
          const data = await response.json()
          setWalletAddress(data.walletAddress)
        }
      } catch (error) {
        console.error('Failed to fetch wallet address:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWalletAddress()
  }, [])

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (walletAddress) {
      // Base Sepolia explorer
      window.open(`https://sepolia.basescan.org/address/${walletAddress}`, '_blank')
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Wallet...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!walletAddress) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            No Wallet Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your internal wallet will be created automatically when you make your first purchase.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 gradient:text-green-400" />
          Internal Wallet Active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Address</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openExplorer}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="font-mono text-xs bg-muted p-2 rounded break-all">
            {walletAddress}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatAddress(walletAddress)}
          </div>
        </div>

        {/* Network Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network</span>
            <Badge variant="default">
              Base Sepolia
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Chain ID: 84532
          </div>
        </div>

        {/* Info */}
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            This is your internal wallet. It's automatically managed and secured by our platform.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
