"use client"

import { Button } from "@/components/ui/button"
import { Wallet, CheckCircle2 } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatAddress } from "@/lib/wallet"
import { useEffect, useState } from "react"

export function WalletConnectButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <Button className="gap-2" disabled>
        <Wallet className="h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (walletAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent hover:bg-accent">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">{formatAddress(walletAddress)}</span>
            <span className="sm:hidden">{walletAddress.slice(0, 4)}...{walletAddress.slice(-2)}</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              Internal
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 gradient:text-green-400" />
            Internal Wallet Active
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5 text-sm">
            <div className="font-medium">Address</div>
            <div className="font-mono text-xs text-muted-foreground break-all">
              {walletAddress}
            </div>
          </div>
          
          <div className="px-2 py-1.5 text-sm">
            <div className="font-medium">Network</div>
            <div className="text-xs text-muted-foreground">
              Base Sepolia (ID: 84532)
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Your wallet is automatically managed and secured by our platform.
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button className="gap-2" disabled>
      <Wallet className="h-4 w-4" />
      Wallet Not Available
    </Button>
  )
}
