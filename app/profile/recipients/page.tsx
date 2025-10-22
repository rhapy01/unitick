"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, Wallet, Mail, User, Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { sanitizeUserInput } from "@/lib/sanitize"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SavedRecipient {
  id: string
  name: string
  email: string
  wallet_address: string
  is_default: boolean
  created_at: string
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<SavedRecipient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<SavedRecipient | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    wallet_address: "",
    is_default: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchRecipients()
  }, [])

  const fetchRecipients = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data, error } = await supabase
      .from("saved_recipients")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching recipients:", error)
      toast({
        title: "Error",
        description: "Failed to load recipients",
        variant: "destructive",
      })
    } else {
      setRecipients(data || [])
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.wallet_address.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Validate wallet address
    if (!formData.wallet_address.startsWith("0x") || formData.wallet_address.length !== 42) {
      toast({
        title: "Invalid Wallet",
        description: "Please enter a valid Ethereum wallet address",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // If setting as default, unset other defaults first
      if (formData.is_default) {
        await supabase
          .from("saved_recipients")
          .update({ is_default: false })
          .eq("user_id", user.id)
      }

      if (editingRecipient) {
        // Update existing
        const { error } = await supabase
          .from("saved_recipients")
          .update({
            name: formData.name.trim(),
            email: formData.email.trim(),
            wallet_address: formData.wallet_address.trim(),
            is_default: formData.is_default,
          })
          .eq("id", editingRecipient.id)

        if (error) throw error

        toast({
          title: "Recipient Updated",
          description: "Recipient details have been updated",
        })
      } else {
        // Create new
        const { error } = await supabase
          .from("saved_recipients")
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            email: formData.email.trim(),
            wallet_address: formData.wallet_address.trim(),
            is_default: formData.is_default,
          })

        if (error) throw error

        toast({
          title: "Recipient Added",
          description: "New recipient has been saved",
        })
      }

      setIsDialogOpen(false)
      setEditingRecipient(null)
      setFormData({ name: "", email: "", wallet_address: "", is_default: false })
      fetchRecipients()
    } catch (error) {
      console.error("Error saving recipient:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recipient",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (recipient: SavedRecipient) => {
    setEditingRecipient(recipient)
    setFormData({
      name: recipient.name,
      email: recipient.email,
      wallet_address: recipient.wallet_address,
      is_default: recipient.is_default,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (recipientId: string) => {
    try {
      const { error } = await supabase
        .from("saved_recipients")
        .delete()
        .eq("id", recipientId)

      if (error) throw error

      toast({
        title: "Recipient Deleted",
        description: "Recipient has been removed",
      })

      fetchRecipients()
    } catch (error) {
      console.error("Error deleting recipient:", error)
      toast({
        title: "Error",
        description: "Failed to delete recipient",
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (recipientId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Unset all defaults first
      await supabase
        .from("saved_recipients")
        .update({ is_default: false })
        .eq("user_id", user.id)

      // Set this one as default
      const { error } = await supabase
        .from("saved_recipients")
        .update({ is_default: true })
        .eq("id", recipientId)

      if (error) throw error

      toast({
        title: "Default Set",
        description: "Default recipient has been updated",
      })

      fetchRecipients()
    } catch (error) {
      console.error("Error setting default:", error)
      toast({
        title: "Error",
        description: "Failed to set default recipient",
        variant: "destructive",
      })
    }
  }

  const openNewDialog = () => {
    setEditingRecipient(null)
    setFormData({ name: "", email: "", wallet_address: "", is_default: false })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground">Loading...</p>
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
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Recipients</h1>
              <p className="text-muted-foreground">Manage your saved recipients for easy gift purchases</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Recipient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRecipient ? "Edit Recipient" : "Add New Recipient"}
                  </DialogTitle>
                  <DialogDescription>
                    Save recipient details for quick gift purchases
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input
                      id="wallet"
                      value={formData.wallet_address}
                      onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                      placeholder="0x1234567890abcdef1234567890abcdef12345678"
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ethereum wallet address where NFT tickets will be sent
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is_default">Set as default recipient</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : editingRecipient ? "Update" : "Add"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {recipients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Recipients Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add recipients to make gift purchases faster and easier
                </p>
                <Button onClick={openNewDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Recipient
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipients.map((recipient) => (
                <Card key={recipient.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{sanitizeUserInput(recipient.name)}</h3>
                          {recipient.is_default && (
                            <Badge variant="secondary" className="gap-1 mt-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recipient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span>{sanitizeUserInput(recipient.email)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Wallet:</span>
                        <span className="font-mono text-xs">
                          {sanitizeUserInput(recipient.wallet_address)?.slice(0, 10)}...
                        </span>
                      </div>
                    </div>

                    {!recipient.is_default && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(recipient.id)}
                          className="w-full"
                        >
                          Set as Default
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
