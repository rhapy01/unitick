"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Listing, CartItem } from "@/lib/types"
import { useState } from "react"

interface AddToCartDialogProps {
  listing: Listing | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (item: Omit<CartItem, 'listing'>) => void
}

export function AddToCartDialog({ listing, isOpen, onClose, onConfirm }: AddToCartDialogProps) {
  const [bookingDate, setBookingDate] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isGift, setIsGift] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")

  const handleConfirm = () => {
    if (!listing || !bookingDate) return

    onConfirm({
      booking_date: bookingDate,
      quantity,
      is_gift: isGift,
      recipient_name: isGift ? recipientName : undefined,
      recipient_email: isGift ? recipientEmail : undefined,
      recipient_phone: isGift ? recipientPhone : undefined,
    })

    // Reset form
    setBookingDate("")
    setQuantity(1)
    setIsGift(false)
    setRecipientName("")
    setRecipientEmail("")
    setRecipientPhone("")
  }

  const handleClose = () => {
    // Reset form when closing
    setBookingDate("")
    setQuantity(1)
    setIsGift(false)
    setRecipientName("")
    setRecipientEmail("")
    setRecipientPhone("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Cart</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="booking-date">Booking Date *</Label>
            <Input
              id="booking-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="is-gift" 
              checked={isGift} 
              onCheckedChange={(checked) => setIsGift(checked === true)} 
            />
            <Label htmlFor="is-gift" className="cursor-pointer">
              This is a gift for someone else
            </Label>
          </div>

          {isGift && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Recipient Information</p>
              <div>
                <Label htmlFor="recipient-name">Recipient Name *</Label>
                <Input
                  id="recipient-name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="recipient-email">Recipient Email *</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="recipient-phone">Recipient Phone</Label>
                <Input
                  id="recipient-phone"
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!bookingDate || (isGift && (!recipientName || !recipientEmail))}
              className="flex-1 bg-accent text-white hover:bg-accent/90"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
