"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { PLATFORM_FEE_PERCENTAGE, SERVICE_TYPES } from "@/lib/constants"
import type { CartItem } from "@/lib/types"

interface CartSidebarProps {
  cartItems: CartItem[]
  onCheckout: () => void
}

export function CartSidebar({ cartItems, onCheckout }: CartSidebarProps) {
  const calculateCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.listing.price * item.quantity, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateCartTotal()
    return subtotal + subtotal * PLATFORM_FEE_PERCENTAGE
  }

  return (
    <Card className="sticky top-20">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Cart ({cartItems.length})</h2>
        </div>

        {cartItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cartItems.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm line-clamp-1">{item.listing.title}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item.quantity}x ${item.listing.price}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {SERVICE_TYPES[item.listing.service_type]}
                    </Badge>
                  </div>
                  {item.is_gift && (
                    <p className="text-xs text-accent mt-1">🎁 Gift for {item.recipient_name}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${calculateCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform fee</span>
                <span>${(calculateCartTotal() * PLATFORM_FEE_PERCENTAGE).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={onCheckout} className="w-full" size="lg">
              Checkout
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
