import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSecureWalletForUser } from '@/lib/wallet-secure'
import { createOrderFromCartItems, createGiftOrderFromCartItems } from '@/lib/contract-client'
import { sendPaymentConfirmationEmail } from '@/lib/email-notifications'
import { verifyPaymentOnChain } from '@/lib/payment-verification'
import { CONTRACT_ADDRESSES } from '@/lib/addresses'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  console.log('[Payment API] Starting payment processing...')
  
  try {
    const body = await request.json()
    console.log('[Payment API] Request body received:', { 
      hasCartItems: !!body.cartItems, 
      cartItemsCount: body.cartItems?.length || 0,
      hasUserId: !!body.userId 
    })
    
    const { cartItems, userId, useExternalWallet } = body

    if (!cartItems || !userId) {
      console.error('[Payment API] Missing required fields:', { cartItems: !!cartItems, userId: !!userId })
      return NextResponse.json(
        { error: 'Cart items and user ID are required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    console.log('[Payment API] Verifying user authentication...')
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Payment API] Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('[Payment API] No user found')
      return NextResponse.json(
        { error: 'No authenticated user found' },
        { status: 401 }
      )
    }
    
    if (user.id !== userId) {
      console.error('[Payment API] User ID mismatch:', { expected: userId, actual: user.id })
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 401 }
      )
    }
    
    console.log('[Payment API] User authenticated successfully:', user.id)

    // Get user's profile
    console.log('[Payment API] Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Payment API] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    // Check wallet type and availability
    if (useExternalWallet) {
      console.log('[Payment API] Using external wallet (MetaMask, etc.)')
      // For external wallet, we don't need to check profile.wallet_address
      // The external wallet will be used directly
    } else {
      // Using internal wallet - check if user has wallet address
      if (!profile.wallet_address) {
        console.error('[Payment API] User has no wallet address for internal wallet:', user.id)
        return NextResponse.json(
          { error: 'No internal wallet found. Please set up internal wallet or use external wallet.' },
          { status: 400 }
        )
      }
    }

    if (!profile) {
      console.error('[Payment API] No profile found for user:', user.id)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.wallet_address) {
      console.error('[Payment API] No wallet address found for user:', user.id)
      return NextResponse.json(
        { error: 'No wallet found. Please create a wallet first.' },
        { status: 400 }
      )
    }
    
    console.log('[Payment API] Profile loaded successfully:', { 
      email: profile.email, 
      walletAddress: profile.wallet_address 
    })

    // Check if this is a gift order
    const hasGiftItems = cartItems.some(item => item.is_gift)
    const giftItems = cartItems.filter(item => item.is_gift)
    const regularItems = cartItems.filter(item => !item.is_gift)
    
    console.log('[Payment API] Order analysis:', {
      totalItems: cartItems.length,
      giftItems: giftItems.length,
      regularItems: regularItems.length,
      hasGiftItems
    })

    // Process the payment using the internal wallet
    console.log('[Payment API] Starting blockchain transaction...')
    try {
      let result
      
      if (hasGiftItems && giftItems.length > 0) {
        // Process gift order - NFTs will be minted directly to recipients
        console.log('[Payment API] Processing gift order with internal wallet...')
        
        // Validate all gift items have recipient wallet addresses
        for (const item of giftItems) {
          if (!item.recipient_wallet) {
            throw new Error(`Gift item ${item._id || item.id} is missing recipient wallet address`)
          }
        }
        
        // Use the new gift order function (now handles multiple recipients)
        result = await createGiftOrderFromCartItems(
          giftItems,
          user.id,
          profile.email
        )
      } else {
        // Process regular order
        console.log('[Payment API] Processing regular order with internal wallet...')
        result = await createOrderFromCartItems(
          cartItems,
          user.id,
          profile.email
        )
      }
      
      console.log('[Payment API] Blockchain transaction result:', {
        success: result.success,
        transactionHash: result.transactionHash,
        error: result.error
      })

      if (result.success) {
        console.log('[Payment API] Blockchain transaction successful:', result.transactionHash)
        
        // Create database order record immediately
        const orderId = randomUUID()
        
        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0)
        const platformFeeTotal = subtotal * 0.005 // 0.5%
        const totalAmount = subtotal + platformFeeTotal
        
        // Create order in database
        const { error: orderError } = await admin
          .from('orders')
          .insert({
            id: orderId,
            user_id: user.id,
            total_amount: totalAmount,
            platform_fee_total: platformFeeTotal,
            wallet_address: profile.wallet_address,
            transaction_hash: `contract_${result.blockchainOrderId}`,
            status: 'confirmed',
            nft_batch_contract_address: process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS || null,
            nft_batch_id: result.blockchainOrderId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (orderError) {
          console.error('[Payment API] Failed to create order in database:', orderError)
          throw new Error(`Database order creation failed: ${orderError.message}`)
        }
        
        console.log('[Payment API] Database order created:', orderId)
        
        // Create bookings for each cart item
        for (const cartItem of cartItems) {
          const bookingId = randomUUID()
          const itemSubtotal = cartItem.listing.price * cartItem.quantity
          const itemPlatformFee = itemSubtotal * 0.005
          const itemTotal = itemSubtotal + itemPlatformFee
          
          // Determine the user_id for the booking
          // For gift items, we need to find or create a profile for the recipient
          let bookingUserId = user.id
          let recipientProfileId = null
          
          if (cartItem.is_gift && cartItem.recipient_email) {
            // Check if recipient already has a profile
            const { data: existingRecipient } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', cartItem.recipient_email.toLowerCase())
              .single()
            
            if (existingRecipient) {
              recipientProfileId = existingRecipient.id
              bookingUserId = existingRecipient.id
            } else {
              // Create a profile for the recipient (they'll claim the gift later)
              const { data: newRecipient, error: recipientError } = await supabase
                .from('profiles')
                .insert({
                  email: cartItem.recipient_email.toLowerCase(),
                  full_name: cartItem.recipient_name || 'Gift Recipient',
                  wallet_address: cartItem.recipient_wallet,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select('id')
                .single()
              
              if (recipientError) {
                console.error('[Payment API] Failed to create recipient profile:', recipientError)
                // Fallback to buyer's profile
                bookingUserId = user.id
              } else {
                recipientProfileId = newRecipient.id
                bookingUserId = newRecipient.id
              }
            }
          }
          
          // Create booking
          const { error: bookingError } = await admin
            .from('bookings')
            .insert({
              id: bookingId,
              order_id: orderId, // Link booking to order
              user_id: bookingUserId, // This will be the recipient for gift items
              listing_id: cartItem.listing.id,
              vendor_id: cartItem.listing.vendor_id,
              booking_date: cartItem.booking_date || new Date().toISOString(), // Fallback to current date if null
              quantity: cartItem.quantity,
              subtotal: itemSubtotal,
              platform_fee: itemPlatformFee,
              total_amount: itemTotal,
              status: 'confirmed',
              is_gift: cartItem.is_gift || false,
              recipient_name: cartItem.recipient_name,
              recipient_email: cartItem.recipient_email,
              recipient_phone: cartItem.recipient_phone,
              recipient_wallet: cartItem.recipient_wallet,
              gift_message: cartItem.gift_message,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (bookingError) {
            console.error('[Payment API] Failed to create booking:', bookingError)
            // Continue with other bookings
          } else {
            // Link booking to order
            const { error: orderItemError } = await admin
              .from('order_items')
              .insert({
                order_id: orderId,
                booking_id: bookingId
              })
            
            if (orderItemError) {
              console.error('[Payment API] Failed to create order_item:', orderItemError)
            }
          }
        }
        
        console.log('[Payment API] All bookings created successfully')
        
        // Clear cart items from database after successful payment
        try {
          const cartItemIds = cartItems.map(item => item._id).filter(Boolean)
          console.log('[Payment API] Cart item IDs to clear:', cartItemIds)
          console.log('[Payment API] Cart items structure:', cartItems.map(item => ({ 
            _id: item._id, 
            listing_id: item.listing?.id,
            quantity: item.quantity 
          })))
          
          if (cartItemIds.length > 0) {
            const { error: cartClearError } = await admin
              .from('cart_items')
              .delete()
              .in('id', cartItemIds)
            
            if (cartClearError) {
              console.error('[Payment API] Failed to clear cart items:', cartClearError)
              // Don't fail the payment if cart clearing fails
            } else {
              console.log('[Payment API] Cart items cleared successfully')
            }
          } else {
            console.log('[Payment API] No cart item IDs found to clear')
          }
        } catch (cartError) {
          console.error('[Payment API] Error clearing cart:', cartError)
          // Don't fail the payment if cart clearing fails
        }
        
        // Call verify-payment edge function to trigger vendor notifications
        try {
          console.log('[Payment API] Calling verify-payment edge function...')
          
          const verificationRequest = {
            transactionHash: `contract_${result.blockchainOrderId}`,
            orderId: orderId,
            expectedAmount: totalAmount.toString(),
            fromAddress: profile.wallet_address,
            toAddress: CONTRACT_ADDRESSES.UNILABOOK,
            chainId: 84532 // Base Sepolia
          }
          
          const verificationResult = await verifyPaymentOnChain(verificationRequest)
          
          if (verificationResult.success) {
            console.log('[Payment API] Payment verification successful, vendor notifications sent')
          } else {
            console.error('[Payment API] Payment verification failed:', verificationResult.error)
            // Don't fail the payment if verification fails
          }
          
        } catch (verificationError) {
          console.error('[Payment API] Error calling verify-payment:', verificationError)
          // Don't fail the payment if verification fails
        }
        
        // Send confirmation email
        try {
          const emailData = {
            orderId: orderId,
            userEmail: profile.email,
            userName: profile.full_name || 'Customer',
            totalAmount: totalAmount,
            transactionHash: result.transactionHash,
            bookings: cartItems.map(item => ({
              title: item.listing.title,
              vendor: item.listing.vendor.business_name,
              quantity: item.quantity,
              bookingDate: item.booking_date,
              price: item.listing.price * item.quantity
            }))
          }
          
          await sendPaymentConfirmationEmail(emailData)
          console.log('[Payment API] Confirmation email sent successfully')
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't fail the payment if email fails
        }

        return NextResponse.json({
          success: true,
          orderId: orderId, // Return the database UUID
          transactionHash: result.transactionHash,
          message: 'Payment processed successfully'
        })
      } else {
        return NextResponse.json(
          { error: result.error || 'Payment failed' },
          { status: 500 }
        )
      }
    } catch (paymentError) {
      console.error('[Payment API] Payment processing error:', paymentError)
      console.error('[Payment API] Error stack:', paymentError instanceof Error ? paymentError.stack : 'No stack trace')
      return NextResponse.json(
        { 
          error: 'Payment processing failed',
          details: paymentError instanceof Error ? paymentError.message : 'Unknown error',
          stack: paymentError instanceof Error ? paymentError.stack : undefined
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Payment API] Top-level error:', error)
    console.error('[Payment API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
