import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  template: string
  data: any
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
    const emailData: EmailRequest = await req.json()

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email directly using Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailContent = generateEmailContent(emailData.template, emailData.subject, emailData.data)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UniTick <noreply@resend.dev>',
        to: [emailData.to], // Send to actual recipient
        subject: emailData.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      
      // If it's a domain verification error, try sending to verified email instead
      if (resendData.message?.includes('domain is not verified') || 
          resendData.message?.includes('testing emails to your own email address')) {
        
        console.log('🔄 Domain not verified, sending to verified email instead...')
        
        const fallbackResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'UniTick <noreply@resend.dev>',
            to: ['nft18295@gmail.com'], // Send to verified address
            subject: `[TEST] ${emailData.subject} - Original recipient: ${emailData.to}`,
            html: emailContent.html,
            text: emailContent.text,
          }),
        })
        
        const fallbackData = await fallbackResponse.json()
        
        if (!fallbackResponse.ok) {
          console.error('Fallback email also failed:', fallbackData)
          return new Response(
            JSON.stringify({ error: 'Failed to send email via Resend' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('✅ Email sent to verified address as fallback')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Email sent to verified address (domain not verified)',
            originalRecipient: emailData.to,
            sentTo: 'nft18295@gmail.com'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to send email via Resend' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send email error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailContent(template: string, subject: string, data: any) {
  const baseUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'

  switch (template) {
    case 'payment-confirmation':
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">✅ Payment Confirmed</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - The Smartest Way to Book Multiple Services</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${subject}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">Your payment has been confirmed and your tickets are ready!</p>

                ${data?.orderId ? `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Order Details</h3>
                  <p style="color: #666; margin: 5px 0;"><strong>Order ID:</strong> ${data.orderId}</p>
                  ${data.totalAmount ? `<p style="color: #666; margin: 5px 0;"><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>` : ''}
                  ${data.transactionHash ? `<p style="color: #666; margin: 5px 0;"><strong>Transaction:</strong> ${formatTransactionHash(data.transactionHash)}</p>` : ''}
                </div>
                ` : ''}

                ${data?.bookings?.length ? `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Your Bookings</h3>
                  ${data.bookings.map((booking: any) => `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                      <p style="margin: 5px 0;"><strong>${booking.title}</strong></p>
                      <p style="margin: 5px 0; color: #666;">${booking.vendor} • ${booking.bookingDate}</p>
                      <p style="margin: 5px 0; color: #666;">Quantity: ${booking.quantity}</p>
                    </div>
                  `).join('')}
                </div>
                ` : ''}

                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${baseUrl}/dashboard"
                     style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    View Your Tickets
                  </a>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    Thank you for using UniTick!<br>
                    <a href="${baseUrl}" style="color: #4CAF50;">Visit UniTick</a> |
                    <a href="${baseUrl}/dashboard" style="color: #4CAF50;">View Dashboard</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${subject}\n\nYour payment has been confirmed and your tickets are ready!\n\n${data?.orderId ? `Order ID: ${data.orderId}\n` : ''}${data?.totalAmount ? `Total Amount: $${data.totalAmount.toFixed(2)}\n` : ''}${data?.transactionHash ? `Transaction: ${formatTransactionHash(data.transactionHash)}\n` : ''}\nView your tickets: ${baseUrl}/dashboard\n\nVisit UniTick: ${baseUrl}`
      }

    case 'gift-notification':
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎁 You Received a Gift!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - The Smartest Way to Book Multiple Services</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${subject}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  ${data?.senderName || 'Someone'} has sent you a gift ticket!
                </p>
                ${data?.giftMessage ? `<p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px; font-style: italic;">"${data.giftMessage}"</p>` : ''}

                ${data?.services?.length ? `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Your Gift Services</h3>
                  ${data.services.map((service: any) => `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                      <p style="margin: 5px 0;"><strong>${service.title}</strong></p>
                      <p style="margin: 5px 0; color: #666;">${service.vendor} • Quantity: ${service.quantity}</p>
                      <p style="margin: 5px 0; color: #666;">Price: $${service.price.toFixed(2)}</p>
                    </div>
                  `).join('')}
                  ${data.totalAmount ? `<p style="margin: 15px 0 0 0; font-weight: bold;">Total Value: $${data.totalAmount.toFixed(2)}</p>` : ''}
                </div>
                ` : ''}

                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${data?.claimUrl || `${baseUrl}/gift/claim`}"
                     style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Claim Your Gift
                  </a>
                </div>

                ${data?.signupUrl ? `
                <div style="text-align: center; margin: 20px 0;">
                  <p style="color: #666; margin-bottom: 10px;">Don't have an account yet?</p>
                  <a href="${data.signupUrl}"
                     style="color: #667eea; text-decoration: underline;">
                    Sign up to claim your gift
                  </a>
                </div>
                ` : ''}

                <!-- Footer -->
                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    This gift was sent to you via UniTick<br>
                    <a href="${baseUrl}" style="color: #667eea;">Visit UniTick</a> |
                    <a href="${baseUrl}/auth/signup" style="color: #667eea;">Create Account</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${subject}\n\n${data?.senderName || 'Someone'} has sent you a gift ticket!\n\n${data?.giftMessage ? `"${data.giftMessage}"\n\n` : ''}${data?.services?.length ? `Your Gift Services:\n${data.services.map((service: any) => `- ${service.title} (${service.vendor}) - $${service.price.toFixed(2)} x ${service.quantity}`).join('\n')}\n\n${data.totalAmount ? `Total Value: $${data.totalAmount.toFixed(2)}\n\n` : ''}` : ''}Claim your gift: ${data?.claimUrl || `${baseUrl}/gift/claim`}\n\n${data?.signupUrl ? `Need an account? Sign up: ${data.signupUrl}\n\n` : ''}Visit UniTick: ${baseUrl}`
      }

    case 'vendor-booking-notification':
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔔 New Booking Alert!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - New Service Booked</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">${subject}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Hi ${data?.vendorName || 'Vendor'},
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Great news! A customer has booked your service(s) on UniTick. Here are the details:
                </p>

                <!-- Customer Information -->
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Customer Information</h3>
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${data?.customerName || 'N/A'}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${data?.customerEmail || 'N/A'}</p>
                  <p style="margin: 5px 0;"><strong>Total Bookings:</strong> ${data?.bookings?.length || 0}</p>
                  <p style="margin: 5px 0;"><strong>Booking Type:</strong> ${data?.isGift ? '🎁 Gift Booking' : '👤 Self Booking'}</p>
                  <p style="margin: 5px 0;"><strong>Order ID:</strong> ${data?.orderId || 'N/A'}</p>
                  ${data?.isGift ? `<p style="margin: 5px 0;"><strong>Gift Recipient:</strong> ${data?.recipientName || 'N/A'}</p>` : ''}
                </div>

                <!-- Bookings -->
                ${data?.bookings?.length ? `
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Booked Services</h3>
                  ${data.bookings.map((booking: any) => `
                    <div style="border-bottom: 1px solid #eee; padding: 15px 0; background: white; margin-bottom: 10px; border-radius: 6px;">
                      <div style="display: flex; justify-between; align-items: start; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: #333; font-size: 16px;">${booking.title}</h4>
                        <span style="font-weight: bold; color: #FF6B35;">$${booking.totalAmount.toFixed(2)}</span>
                      </div>
                      <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${booking.quantity}</p>
                      <p style="margin: 5px 0; color: #666;"><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
                      ${booking.customerNotes && booking.customerNotes !== 'No special notes' ? `<p style="margin: 5px 0; color: #666;"><strong>Customer Notes:</strong> ${booking.customerNotes}</p>` : ''}
                    </div>
                  `).join('')}
                  <div style="border-top: 2px solid #ddd; padding-top: 15px; margin-top: 15px;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #FF6B35; text-align: right;">
                      Total Revenue: $${data.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                ` : ''}

                <!-- Action Buttons -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${data?.vendorDashboardUrl || `${baseUrl}/vendor/dashboard`}"
                     style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin-right: 10px;">
                    View in Dashboard
                  </a>
                  <a href="mailto:${data?.customerEmail || ''}"
                     style="background: #666; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Contact Customer
                  </a>
                </div>

                <!-- Important Notes -->
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">📋 Important Reminders:</h3>
                  <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>Prepare your service for the booking date</li>
                    <li>Contact the customer if you need additional information</li>
                    <li>Mark the booking as completed after service delivery</li>
                    <li>Payment has been processed and is available for withdrawal</li>
                  </ul>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    You're receiving this because a customer booked your service on UniTick<br>
                    <a href="${baseUrl}" style="color: #FF6B35;">Visit UniTick</a> |
                    <a href="${baseUrl}/vendor/dashboard" style="color: #FF6B35;">Vendor Dashboard</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${subject}\n\nHi ${data?.vendorName || 'Vendor'},\n\nGreat news! A customer has booked your service(s) on UniTick.\n\nCustomer Information:\n- Name: ${data?.customerName || 'N/A'}\n- Email: ${data?.customerEmail || 'N/A'}\n- Total Bookings: ${data?.bookings?.length || 0}\n- Booking Type: ${data?.isGift ? '🎁 Gift Booking' : '👤 Self Booking'}\n- Order ID: ${data?.orderId || 'N/A'}\n${data?.isGift ? `- Gift Recipient: ${data?.recipientName || 'N/A'}\n` : ''}\nBooked Services:\n${data?.bookings?.map((booking: any) => `- ${booking.title} (x${booking.quantity}) - $${booking.totalAmount.toFixed(2)} on ${new Date(booking.bookingDate).toLocaleDateString()}${booking.customerNotes && booking.customerNotes !== 'No special notes' ? `\n  Notes: ${booking.customerNotes}` : ''}`).join('\n') || 'N/A'}\n\nTotal Revenue: $${data?.totalAmount?.toFixed(2) || '0.00'}\n\nView in Dashboard: ${data?.vendorDashboardUrl || `${baseUrl}/vendor/dashboard`}\nContact Customer: mailto:${data?.customerEmail || ''}\n\nImportant Reminders:\n- Prepare your service for the booking date\n- Contact the customer if needed\n- Mark booking as completed after service\n- Payment is available for withdrawal\n\nVisit UniTick: ${baseUrl}`
      }

    default:
      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;">
              <div style="background: #667eea; padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${subject}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">UniTick - The Smartest Way to Book Multiple Services</p>
              </div>

              <div style="padding: 40px 30px;">
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">You have a new notification from UniTick.</p>

                <div style="text-align: center; margin: 40px 0;">
                  <a href="${baseUrl}/dashboard"
                     style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    View Dashboard
                  </a>
                </div>

                <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
                  <p style="color: #999; font-size: 14px; margin: 0;">
                    <a href="${baseUrl}" style="color: #667eea;">Visit UniTick</a> |
                    <a href="${baseUrl}/dashboard" style="color: #667eea;">View Dashboard</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${subject}\n\nYou have a new notification from UniTick.\n\nView dashboard: ${baseUrl}/dashboard\n\nVisit UniTick: ${baseUrl}`
      }
  }
}
