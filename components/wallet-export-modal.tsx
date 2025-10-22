"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Download, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletExportModalProps {
  children: React.ReactNode
}

export function WalletExportModal({ children }: WalletExportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [walletData, setWalletData] = useState<any>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/wallet/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export wallet')
      }

      if (result.success) {
        setWalletData(result.walletData)
        toast({
          title: "Wallet Export Ready",
          description: "Your wallet data has been prepared for export.",
        })
      }
    } catch (error) {
      console.error('[Wallet Export] Error:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast({
        title: "Copied",
        description: `${field} copied to clipboard`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const downloadWalletData = () => {
    if (!walletData) return

    const data = {
      address: walletData.address,
      privateKey: walletData.privateKey,
      exportDate: new Date().toISOString(),
      instructions: walletData.exportInstructions
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wallet-export-${walletData.address.slice(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Downloaded",
      description: "Wallet data downloaded successfully",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!walletData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Export your wallet to use it in external applications like MetaMask, Coinbase Wallet, etc.
              </p>
              <Button onClick={handleExport} disabled={isLoading}>
                {isLoading ? "Preparing Export..." : "Generate Export Data"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Security Warning:</strong> Keep your private key secure and never share it with anyone. 
                  Anyone with access to your private key can control your wallet.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Wallet Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      value={walletData.address}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(walletData.address, "Address")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="privateKey"
                      type={showPrivateKey ? "text" : "password"}
                      value={walletData.privateKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(walletData.privateKey, "Private Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Import Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {walletData.exportInstructions.map((instruction: string, index: number) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {instruction}
                    </p>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={downloadWalletData} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Wallet Data
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
