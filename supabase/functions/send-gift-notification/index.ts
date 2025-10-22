import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GiftNotificationData {
  recipientEmail: string
  recipientName: string
  senderName: string
  giftMessage?: string
  services: Array<{
    title: string
    vendor: string
    quantity: number
    price: number
  }>
  totalAmount: number
  claimUrl: string
  signupUrl: string
  transactionHash?: string // Add transaction hash support
}

// Helper function to format transaction hash for internal wallet
function formatTransactionHash(transactionHash: string): string {
  if (transactionHash.startsWith('contract_')) {
    const contractOrderId = transactionHash.replace('contract_', '')
    return `Contract Order #${contractOrderId}`
  }
  return transactionHash
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const giftData: GiftNotificationData = await req.json()

    // Validate required fields
    if (!giftData.recipientEmail || !giftData.recipientName || !giftData.senderName || !giftData.claimUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Send gift notification email
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: giftData.recipientEmail,
        subject: 'You\'ve Received a Gift Ticket!',
        template: 'gift-notification',
        data: {
          recipientName: giftData.recipientName,
          senderName: giftData.senderName,
          giftMessage: giftData.giftMessage,
          services: giftData.services,
          totalAmount: giftData.totalAmount,
          claimUrl: giftData.claimUrl,
          signupUrl: giftData.signupUrl
        }
      }
    })

    if (error) {
      console.error('Gift notification email error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send gift notification email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Gift notification sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send gift notification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
