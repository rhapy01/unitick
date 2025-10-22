import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cartItemIds } = await request.json()

    if (!cartItemIds || !Array.isArray(cartItemIds)) {
      return NextResponse.json({ 
        error: "Cart item IDs are required" 
      }, { status: 400 })
    }

    console.log('🧹 Clearing cart items after successful payment:', cartItemIds)

    // Clear cart items from database
    const { error: cartClearError } = await supabase
      .from('cart_items')
      .delete()
      .in('id', cartItemIds)
      .eq('user_id', user.id) // Ensure user can only clear their own cart items

    if (cartClearError) {
      console.error('Failed to clear cart items:', cartClearError)
      return NextResponse.json({ 
        error: "Failed to clear cart items",
        details: cartClearError.message 
      }, { status: 500 })
    }

    console.log('✅ Cart items cleared successfully')

    return NextResponse.json({ 
      success: true,
      message: "Cart items cleared successfully",
      clearedItems: cartItemIds.length
    })

  } catch (error) {
    console.error('Error clearing cart items:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current cart items for the user
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id, quantity, booking_date, listing:listings(title, price)')
      .eq('user_id', user.id)

    if (cartError) {
      console.error('Failed to fetch cart items:', cartError)
      return NextResponse.json({ 
        error: "Failed to fetch cart items",
        details: cartError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      cartItems: cartItems || [],
      itemCount: cartItems?.length || 0
    })

  } catch (error) {
    console.error('Error fetching cart items:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
